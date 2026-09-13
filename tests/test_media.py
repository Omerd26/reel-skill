"""Regression tests that need ffmpeg: cutting, fast-tier timing, validation, QA."""
import json
import subprocess
import sys
import unittest
from pathlib import Path

from helpers import (ROOT, have_ffmpeg, run, tmpdir, tone_clip, words_over, write_json)
from reelkit import FPS
from reelkit.cutting import plan_cut, write_base
from reelkit.media import keyframe_times, probe, tool
from reelkit.project import Project

PY = sys.executable
SCRIPTS = ROOT / "scripts"
SEGMENTS = [("silence", 0.8), ("tone", 2.0), ("silence", 1.6), ("tone", 2.0), ("silence", 0.9)]
TEXT = "שלום לכולם היום אני אראה לכם איך הגעתי לעשרת אלפים צפיות".split()


class PlanCut(unittest.TestCase):
    def test_nothing_to_cut_still_trims_ends_and_keeps_everything_else(self):
        words = [{"word": "a", "start": 1.0, "end": 1.4}, {"word": "b", "start": 1.5, "end": 3.0}]
        plan = plan_cut(4.0, words, silences=[], manual_removals=[])
        self.assertEqual(plan["keeps"], [(round(0.8 * FPS), round(3.45 * FPS))])

    def test_silence_overlapping_a_word_is_not_cut(self):
        words = [{"word": "a", "start": 1.0, "end": 2.5}]
        plan = plan_cut(5.0, words, silences=[(2.0, 3.5)], trim_ends=False)
        self.assertEqual(plan["removals"], [])

    def test_cutting_the_last_sentence_moves_the_tail(self):
        words = [{"word": "a", "start": 0.5, "end": 1.0}, {"word": "b", "start": 1.1, "end": 1.6},
                 {"word": "aside", "start": 3.0, "end": 4.0}]
        plan = plan_cut(5.0, words, silences=[], manual_removals=[{"start": 2.9, "end": 4.1}])
        self.assertEqual(plan["keeps"][-1][1], round((1.6 + 0.45) * FPS))

    def test_manual_removal_is_applied(self):
        words = [{"word": "a", "start": 0.5, "end": 1.0}, {"word": "b", "start": 3.0, "end": 3.5}]
        plan = plan_cut(4.0, words, silences=[], manual_removals=[{"start": 1.5, "end": 2.5}], trim_ends=False)
        self.assertEqual(plan["keeps"], [(0, 45), (75, 120)])


@unittest.skipUnless(have_ffmpeg(), "ffmpeg missing")
class CutOutput(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dir = tmpdir()
        cls.clip = tone_clip(cls.dir / "raw.mp4", SEGMENTS)
        cls.words = words_over(SEGMENTS, TEXT)

    def test_base_video_is_seek_friendly_and_exact(self):
        out = self.dir / "base.mp4"
        edit = write_base(self.clip, {"words": self.words}, out, self.dir / "tr.json")
        info = probe(out)
        self.assertEqual(info["has_b_frames"], 0, "B-frames bring back the render freeze")
        kf = keyframe_times(out)
        self.assertLessEqual(max(b - a for a, b in zip(kf, kf[1:])), 1.01, f"keyframes too far apart: {kf}")
        self.assertEqual(info["frames"], edit["base"]["frames"])
        self.assertAlmostEqual(info["audio_duration"], info["frames"] / FPS, delta=0.05)
        self.assertEqual(sum(1 for r in edit["removals"] if r["reason"] == "silence"), 1)
        last_word_end = max(w["end"] for w in self.words)
        self.assertGreaterEqual(edit["keeps_seconds"][-1][1], last_word_end + 0.4,
                                "the air after the last word must survive the silence cut")
        tr = json.loads((self.dir / "tr.json").read_text(encoding="utf-8"))
        self.assertLessEqual(tr["words"][-1]["end"], edit["base"]["duration_seconds"])

    def test_legacy_autocut_never_leaves_a_stale_output(self):
        """Old bug: no silences → cut.mp4 not written → an older cut.mp4 got rendered."""
        work = self.dir / "legacy"
        work.mkdir()
        cut = work / "cut.mp4"
        tr = write_json(work / "t.json", {"words": self.words})
        run([PY, str(SCRIPTS / "autocut.py"), str(self.clip), str(tr), "--out", str(cut)])
        long_frames = probe(cut)["frames"]
        tight_segments = [("tone", 1.5)]
        tight = tone_clip(work / "tight.mp4", tight_segments)
        tr2 = write_json(work / "t2.json", {"words": words_over(tight_segments, TEXT[:3])})
        run([PY, str(SCRIPTS / "autocut.py"), str(tight), str(tr2), "--out", str(cut)])
        self.assertLess(probe(cut)["frames"], long_frames)
        self.assertLessEqual(probe(cut)["frames"], 46)

    def test_fast_tier_captions_are_not_shifted_twice(self):
        """Old bug: split_captions shifted by the head cut AND make_captions remapped
        again → first card dropped, the rest early by the head length."""
        words = [{"word": w, "start": 1.0 + i * 0.5, "end": 1.4 + i * 0.5} for i, w in enumerate(TEXT[:6])]
        tr = write_json(self.dir / "fixture.json", {"duration": 5.0, "words": words})
        plan = self.dir / "plan.json"
        caps = self.dir / "caps"
        run([PY, str(SCRIPTS / "split_captions.py"), str(tr), "--out", str(plan)])
        run([PY, str(SCRIPTS / "make_captions.py"), str(plan), str(caps)])
        p = json.loads(plan.read_text(encoding="utf-8"))
        head = p["cuts"][0]["start"]
        entries = json.loads((caps / "overlays.json").read_text(encoding="utf-8"))
        self.assertEqual(len(entries), len(p["captions"]), "a caption card was dropped")
        self.assertAlmostEqual(entries[0]["start"], words[0]["start"] - head, places=2)


@unittest.skipUnless(have_ffmpeg(), "ffmpeg missing")
class Validation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from reelkit.validate import validate
        cls.validate = staticmethod(validate)
        cls.dir = tmpdir()
        segs = [("tone", 3.0), ("silence", 0.5), ("tone", 3.0)]
        clip = tone_clip(cls.dir / "raw.mp4", segs)
        cls.words = words_over(segs, ["תזכרו", "את", "המספר", "3", "והנה", "עוד", "משפט", "קצר", "לסיום", "טוב", "מאוד", "ממש"])
        cls.edit = write_base(clip, {"words": cls.words}, cls.dir / "base.mp4", cls.dir / "tr.json", trim_ends=False,
                              cut_silences=False)
        cls.base_words = json.loads((cls.dir / "tr.json").read_text(encoding="utf-8"))["words"]

    def props(self, **over):
        p = {"video_path": str(self.dir / "base.mp4"), "words": self.base_words,
             "duration_seconds": self.edit["base"]["duration_seconds"],
             "duration_frames": self.edit["base"]["frames"], "fps": 30, "captions_style": "highlight",
             "rules": {"min_overlays": 0, "min_brolls": 0, "zoom_every_seconds": 0},
             "editing_plan": {"overlay_scenes": [], "broll_scenes": []}}
        p.update(over)
        return write_json(self.dir / "props.json", p)

    def errors(self, **over):
        return self.validate(self.props(**over)).errors

    def test_clean_plan_passes(self):
        self.assertEqual(self.errors(), [])

    def test_hook_style_alias_warns_and_bad_variant_errors(self):
        rep = self.validate(self.props(hook={"text": "הוק קצר", "style": "minimal-clean"}))
        self.assertEqual(rep.errors, [])
        self.assertTrue(any("hook.style" in w for w in rep.warns))
        self.assertTrue(any("variant" in e for e in self.errors(hook={"text": "הוק", "variant": "neon"})))

    def test_missing_video_and_wrong_length_are_errors(self):
        self.assertTrue(any("לא נמצא" in e for e in self.errors(video_path=str(self.dir / "nope.mp4"))))
        n = self.edit["base"]["frames"]
        self.assertTrue(any("פריים קפוא" in e for e in self.errors(duration_frames=n + 30, duration_seconds=(n + 30) / 30)))

    def test_early_scene_default_rule_and_overrides(self):
        card = {"id": "c", "type": "glass_info_card", "title": "טקסט", "start": 0.5, "end": 3.0}
        self.assertTrue(self.errors(editing_plan={"overlay_scenes": [card]}))
        opening = {**card, "role": "opening", "end": 2.0}
        self.assertEqual(self.errors(editing_plan={"overlay_scenes": [opening]}), [])
        long_opening = {**card, "role": "opening", "end": 3.0}
        self.assertTrue(self.errors(editing_plan={"overlay_scenes": [long_opening]}))
        self.assertEqual(self.errors(editing_plan={"overlay_scenes": [card]},
                                     rules={"protect_hook_seconds": 0, "min_overlays": 0, "min_brolls": 0}), [])

    def test_numbers_must_be_spoken(self):
        ok = {"id": "n", "type": "metric_lockup", "value": 3, "start": 4.0, "end": 6.0}
        self.assertEqual(self.errors(editing_plan={"overlay_scenes": [ok]}), [])
        bad = {**ok, "value": 7}
        self.assertTrue(any("לא נאמר" in e for e in self.errors(editing_plan={"overlay_scenes": [bad]})))

    def test_anchor_on_detected_face_warns(self):
        und = {"frames": [{"t": 5.0, "faces": [[300, 820, 460, 460]]}]}   # low selfie face
        write_json(self.dir / "work_und.json", und)
        proj = self.dir / "proj"
        (proj / "work").mkdir(parents=True, exist_ok=True)
        write_json(proj / "project.json", {"stages": {}})
        write_json(proj / "work" / "understanding.json", und)
        write_json(proj / "work" / "requirements.json", {"requirements": [], "rules": {}})
        scene = {"id": "rank", "type": "medal_rank", "items": [{"label": "א"}, {"label": "ב"}], "start": 4.0, "end": 6.0}
        props = json.loads(self.props(editing_plan={"overlay_scenes": [scene]}).read_text(encoding="utf-8"))
        props["rules"] = {"min_overlays": 0, "min_brolls": 0, "zoom_every_seconds": 0}
        pp = write_json(proj / "work" / "props.json", props)
        warns = self.validate(pp, proj, check_files=False).warns
        self.assertTrue(any("נופל על הפנים" in w for w in warns), warns)
        scene["anchor"] = "top-center"
        props["editing_plan"]["overlay_scenes"] = [scene]
        write_json(pp, props)
        warns = self.validate(pp, proj, check_files=False).warns
        self.assertFalse(any("נופל על הפנים" in w for w in warns), warns)
        scene["anchor"] = "middle"
        write_json(pp, props)
        self.assertTrue(any("anchor" in e for e in self.validate(pp, proj, check_files=False).errors))

    def test_custom_layers_schema(self):
        good = {"id": "x", "type": "custom_layers", "start": 4.0, "end": 6.0,
                "layers": [{"kind": "text", "text": "3", "x": 600, "y": 400, "w": 300, "h": 300, "enter": "pop"}]}
        self.assertEqual(self.errors(editing_plan={"overlay_scenes": [good]}), [])
        bad = {**good, "layers": [{"kind": "image", "x": 0, "y": 0, "src": "missing.png", "enter": "zoomy"}]}
        errs = self.errors(editing_plan={"overlay_scenes": [bad]})
        self.assertTrue(any("enter" in e for e in errs))
        self.assertTrue(any("missing.png" in e for e in errs))


@unittest.skipUnless(have_ffmpeg(), "ffmpeg missing")
class Understanding(unittest.TestCase):
    def test_editor_instruction_vs_viewer_and_relation(self):
        from reelkit.understand import find_cues, find_relations
        words = []
        t = 0.0
        for sentence in (["תזכרו", "את", "המספר", "3."], ["עורך,", "תציג", "את", "זה", "כאן", "לידי."]):
            for w in sentence:
                words.append({"word": w, "start": round(t, 2), "end": round(t + 0.3, 2)})
                t += 0.35
            t += 0.8
        cues = find_cues(words)
        by_quote = {c["quote"]: c for c in cues}
        self.assertEqual(by_quote["תזכרו את המספר 3"]["addressed_to_guess"], "viewer")
        self.assertEqual(by_quote["עורך תציג את זה כאן לידי"]["addressed_to_guess"], "editor")
        rel = [r for r in find_relations(words, cues) if r["type"] == "remember_then_use"]
        self.assertEqual(rel[0]["values"], [3.0])
        self.assertTrue(rel[0]["possible_later_uses"])


class FaceCoverage(unittest.TestCase):
    """Regression 13.9 (real take): a small number on the speaker's mouth passed QA at
    the old 20% / 6% thresholds. Synthetic textured frame + drawn text, no real face."""

    def test_small_text_on_face_is_caught_and_clean_frame_is_not(self):
        try:
            import numpy as np
            from PIL import Image, ImageDraw, ImageFont
        except ImportError:
            self.skipTest("numpy/Pillow missing")
        from reelkit.qa import FACE_COVER_THRESHOLD, face_coverage, graphics_mask
        d = tmpdir()
        rng = np.random.default_rng(7)
        base = (rng.integers(90, 170, (1920, 1080, 3))).astype("uint8")
        Image.fromarray(base).resize((540, 960)).resize((1080, 1920)).save(d / "base.png")
        box = [290, 855, 459, 459]
        font = ImageFont.truetype(str(ROOT / "assets" / "fonts" / "Heebo-ExtraBold.ttf"), 50)
        img = Image.open(d / "base.png").convert("RGB")
        ImageDraw.Draw(img).text((480, 1130), "23", font=font, fill="white", stroke_width=3, stroke_fill="black")
        img.save(d / "on_face.png")
        clean = face_coverage(graphics_mask(d / "base.png", d / "base.png", 1.0), box)
        covered = face_coverage(graphics_mask(d / "on_face.png", d / "base.png", 1.0), box)
        self.assertLessEqual(clean, FACE_COVER_THRESHOLD)
        self.assertGreater(covered, FACE_COVER_THRESHOLD)


@unittest.skipUnless(have_ffmpeg(), "ffmpeg missing")
class QAChecks(unittest.TestCase):
    """QA must catch the two failures the old engine shipped: a frozen tail with
    silence, and audio that lags the picture."""

    @classmethod
    def setUpClass(cls):
        cls.dir = tmpdir()
        cls.project = Project(cls.dir / "proj")
        cls.project.mkdirs()
        segs = [("tone", 1.0), ("silence", 0.3), ("tone", 1.2)]
        src = tone_clip(cls.dir / "raw.mp4", segs)
        words = words_over(segs, ["אחת", "שתיים", "שלוש", "ארבע", "חמש"])
        edit = write_base(src, {"words": words}, cls.project.base, cls.project.base_transcript, trim_ends=False,
                          cut_silences=False)
        write_json(cls.project.edit, edit)
        write_json(cls.project.manifest, {"source": {"fingerprint": "x"}, "stages": {}})
        write_json(cls.project.props, {"video_path": edit["base"]["path"], "words": words,
                                       "duration_seconds": edit["base"]["duration_seconds"],
                                       "duration_frames": edit["base"]["frames"], "fps": 30,
                                       "captions_style": "none", "editing_plan": {}})
        cls.frames = edit["base"]["frames"]

    def check(self, output):
        from reelkit import qa
        rep = qa.run(self.project, output, "full")
        return {c["id"]: c for c in rep["checks"]}

    def test_good_output_passes(self):
        c = self.check(self.project.base)
        for cid in ("exact_length", "audio_length", "engine_freeze", "audio_sync"):
            self.assertEqual(c[cid]["status"], "pass", c[cid])

    def test_frozen_tail_is_caught(self):
        out = self.dir / "frozen_tail.mp4"
        run([tool("ffmpeg"), "-y", "-v", "error", "-i", str(self.project.base), "-vf", "tpad=stop_mode=clone:stop_duration=1",
             "-af", "apad=pad_dur=1", "-c:v", "libx264", "-c:a", "aac", str(out)])
        c = self.check(out)
        self.assertEqual(c["exact_length"]["status"], "fail")
        self.assertEqual(c["engine_freeze"]["status"], "fail")
        self.assertEqual(c["edge_silence"]["status"], "fail")

    def test_large_audio_lag_fails(self):
        out = self.dir / "very_late.mp4"
        run([tool("ffmpeg"), "-y", "-v", "error", "-i", str(self.project.base), "-map", "0:v", "-map", "0:a",
             "-c:v", "copy", "-af", "adelay=150:all=1,atrim=0:%.3f" % (self.frames / 30), "-c:a", "aac", str(out)])
        self.assertEqual(self.check(out)["audio_sync"]["status"], "fail")

    def test_audio_lag_is_caught_and_fixed(self):
        from reelkit.media import fix_audio_delay
        out = self.dir / "late_audio.mp4"
        # simulate the Remotion mux: 2048 priming samples played as audio
        run([tool("ffmpeg"), "-y", "-v", "error", "-i", str(self.project.base), "-map", "0:v", "-map", "0:a",
             "-c:v", "copy", "-af", "adelay=42.667:all=1", "-c:a", "pcm_s16le", str(self.dir / "late.mov")])
        run([tool("ffmpeg"), "-y", "-v", "error", "-i", str(self.dir / "late.mov"), "-c:v", "copy", "-c:a", "aac",
             "-bsf:a", "aac_adtstoasc", str(out)])
        before = self.check(out)["audio_sync"]
        self.assertIn(before["status"], ("warn", "fail"), before)
        self.assertGreater(fix_audio_delay(out, reference=self.project.base), 0.03)
        after = self.check(out)["audio_sync"]
        self.assertEqual(after["status"], "pass", after)


if __name__ == "__main__":
    unittest.main()
