"""End-to-end Remotion render regressions (needs node + remotion/node_modules).

Skipped automatically when the full tier is not installed; set REEL_SKIP_RENDER=1
to skip on purpose (each render takes ~15-30s).
"""
import json
import os
import subprocess
import unittest

from helpers import ROOT, have_ffmpeg, have_remotion, run, tmpdir, tone_clip, write_json
from reelkit.cutting import write_base
from reelkit.media import fix_audio_delay, probe, tool

RENDER = ROOT / "remotion" / "render_edit.mjs"


def pixel(video, t, x, y, size=20):
    r = subprocess.run([tool("ffmpeg"), "-v", "error", "-ss", str(t), "-i", str(video), "-frames:v", "1",
                        "-vf", f"crop={size}:{size}:{x}:{y},scale=1:1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                       capture_output=True)
    return tuple(r.stdout[:3])


@unittest.skipUnless(have_ffmpeg() and have_remotion() and not os.environ.get("REEL_SKIP_RENDER"),
                     "full tier not installed (or REEL_SKIP_RENDER set)")
class RemotionRender(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Remotion downloads a headless browser on first use. Offline, that fails before any
        # frame is rendered — that says nothing about our code, so skip with the reason.
        probe = subprocess.run(
            ["node", "--input-type=module", "-e",
             "import {ensureBrowser} from '@remotion/renderer'; await ensureBrowser(); console.log('BROWSER_OK')"],
            cwd=str(ROOT / "remotion"), capture_output=True, text=True, timeout=600)
        if "BROWSER_OK" not in probe.stdout:
            raise unittest.SkipTest("Remotion headless browser unavailable (offline?): "
                                    + (probe.stderr.strip().splitlines() or ["?"])[-1][:160])
        cls.dir = tmpdir()
        segs = [("tone", 2.0)]
        words = [{"word": w, "start": 0.2 + i * 0.45, "end": 0.6 + i * 0.45}
                 for i, w in enumerate(["עם", "Claude", "Code", "היום"])]
        cls.words = words
        for name, color in (("gray", "0x303030"), ("blue", "blue")):
            clip = tone_clip(cls.dir / f"{name}_raw.mp4", segs, color=color)
            write_base(clip, {"words": words}, cls.dir / f"{name}.mp4", cls.dir / f"{name}.json",
                       trim_ends=False, cut_silences=False)
        cls.base = cls.dir / "work" / "base.mp4"
        cls.base.parent.mkdir()

    def render(self, props: dict, out_name: str):
        props_path = write_json(self.base.parent / "props.json", props)
        out = self.dir / out_name
        r = subprocess.run(["node", str(RENDER), "--props", str(props_path), "--output", str(out)],
                           capture_output=True, text=True, cwd=str(self.dir))
        last = [ln for ln in r.stdout.splitlines() if ln.startswith("{")]
        result = json.loads(last[-1]) if last else {}
        self.assertTrue(result.get("success"), f"render failed: {result} {r.stderr[-800:]}")
        return out

    def props(self, **over):
        base = {"video_path": "base.mp4", "words": self.words, "duration_seconds": 2.0, "duration_frames": 60,
                "fps": 30, "captions_style": "highlight", "brand_color": "#E0701E", "editing_plan": {}}
        base.update(over)
        return base

    def test_exact_frames_same_path_replacement_hook_alias_and_groups(self):
        import shutil
        shutil.copy(self.dir / "gray.mp4", self.base)
        groups = [{"id": "g1", "start": 0.2, "end": 1.9, "break_after": None,
                   "words": [{**w, "emphasis": i == 1} for i, w in enumerate(self.words[:3])]}]
        out1 = self.render(self.props(caption_groups=groups,
                                      hook={"text": "בדיקה", "style": "highlight-box", "start": 0, "end": 2}),
                           "first.mp4")
        info = probe(out1)
        self.assertEqual(info["frames"], 60, "no hidden +1s buffer")
        # hook.style (legacy key) must select the orange pill variant
        r, g, b = pixel(out1, 1.0, 384, 252, size=8)     # inside the pill, left of the text
        self.assertGreater(r, 180, (r, g, b))
        self.assertLess(b, 90, (r, g, b))

        # same relative path, new content → the new video must be rendered
        shutil.copy(self.dir / "blue.mp4", self.base)
        out2 = self.render(self.props(), "second.mp4")
        r2, g2, b2 = pixel(out2, 1.0, 100, 900)
        self.assertGreater(b2, 150, f"stale video served: {(r2, g2, b2)}")

    def test_missing_asset_is_a_hard_error(self):
        props_path = write_json(self.base.parent / "props_missing.json",
                                self.props(video_path="does_not_exist.mp4"))
        r = subprocess.run(["node", str(RENDER), "--props", str(props_path), "--output", str(self.dir / "x.mp4")],
                           capture_output=True, text=True)
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("not found", r.stdout)

    def test_audio_delay_is_removed_after_render(self):
        import shutil
        shutil.copy(self.dir / "gray.mp4", self.base)
        out = self.render(self.props(captions_style="none"), "delay.mp4")
        before = probe(out)
        removed = fix_audio_delay(out, reference=self.base)
        after = probe(out)
        self.assertAlmostEqual(after["audio_duration"], after["frames"] / 30, delta=0.03)
        if before["audio_duration"] - before["frames"] / 30 > 0.005:
            self.assertGreater(removed, 0.0)


if __name__ == "__main__":
    unittest.main()
