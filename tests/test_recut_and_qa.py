"""Regressions from the second review round (13.9.2026): routine fixes that still broke.

1. a second cut crashed when an overlay had a string anchor ("top-center")
2. a second manual --remove silently brought back the first removed stretch
3. Hebrew number words: "שלוש מאות" parsed as 103, a spoken count "אחד, שניים, שלושה" as 6
4. qa --finalize approved a stale report (output replaced or missing, props changed)
+ sfx timestamps did not follow a re-cut; the fast tier ignored caption_offset
"""
import json
import subprocess
import sys
import unittest

from helpers import ROOT, have_ffmpeg, tmpdir, tone_clip, write_json
from reelkit.hebrew import spoken_numbers
from reelkit.project import Project

PY = sys.executable
REEL = str(ROOT / "scripts" / "reel.py")
SEGS = [("tone", 2.0), ("silence", 0.3), ("tone", 2.0), ("silence", 0.3), ("tone", 2.0), ("silence", 0.3), ("tone", 2.0)]


def reel(*args, ok=True):
    r = subprocess.run([PY, REEL, *map(str, args)], capture_output=True, text=True)
    if ok and r.returncode != 0:
        raise AssertionError(f"reel {' '.join(map(str, args))} failed:\n{r.stdout}\n{r.stderr}")
    return r


def words_every(total: float, step: float = 0.4) -> list[dict]:
    names = ["אחת", "שתיים", "שלוש", "ארבע", "חמש", "שש", "שבע", "שמונה", "תשע", "עשר"]
    out, t, i = [], 0.1, 0
    while t + 0.3 < total:
        out.append({"word": f"מילה{i}" if i % 10 else names[(i // 10) % 10], "start": round(t, 2), "end": round(t + 0.3, 2)})
        t += step
        i += 1
    return out


def W(tokens):
    return [{"word": w, "start": i * 0.3, "end": i * 0.3 + 0.25} for i, w in enumerate(tokens)]


class HebrewNumbers(unittest.TestCase):
    def values(self, text):
        return [n["value"] for n in spoken_numbers(W(text.split()))]

    def test_compound_numbers(self):
        cases = {
            "שלוש מאות": [300], "חמש מאות": [500], "תשע מאות": [900], "מאה": [100], "מאתיים": [200],
            "מאה עשרים ושלוש": [123], "עשרים ושלוש": [23], "שלוש עשרה": [13], "אחת עשרה": [11],
            "שלושת אלפים": [3000], "עשרת אלפים": [10000], "אלף תשע מאות": [1900], "אלפיים": [2000],
            "מאה אלף": [100000], "שלוש מאות אלף": [300000], "חצי מיליון": [500000], "מיליון": [1000000],
            "2 מיליון": [2000000], "10 אלף": [10000],
        }
        for text, expected in cases.items():
            self.assertEqual(self.values(text), expected, text)

    def test_a_spoken_count_is_several_numbers(self):
        self.assertEqual(self.values("אחד, שניים, שלושה"), [1, 2, 3])
        self.assertEqual(self.values("אחד שניים שלושה"), [1, 2, 3])
        self.assertEqual(self.values("עשרים שלושים"), [20, 30])

    def test_validator_accepts_300_and_rejects_103(self):
        from reelkit.validate import validate
        d = tmpdir()
        words = W("הגענו ל שלוש מאות לקוחות השנה וזה הרבה".split())
        base = {"video_path": "x.mp4", "words": words, "duration_seconds": 6.0, "fps": 30,
                "captions_style": "none", "rules": {"min_overlays": 0, "min_brolls": 0, "zoom_every_seconds": 0},
                "hook": None}
        for value, ok in ((300, True), (103, False)):
            props = dict(base, editing_plan={"overlay_scenes": [
                {"id": "n", "type": "metric_lockup", "value": value, "start": 3.6, "end": 5.9}]})
            errs = validate(write_json(d / "props.json", props), check_files=False).errors
            self.assertEqual(not any("לא נאמר" in e for e in errs), ok, (value, errs))


@unittest.skipUnless(have_ffmpeg(), "ffmpeg missing")
class RecutFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dir = tmpdir()
        clip = tone_clip(cls.dir / "clip.mp4", SEGS)
        out = reel("init", clip, "--project", cls.dir / "proj").stdout
        cls.p = Project(cls.dir / "proj")
        total = sum(d for _, d in SEGS)
        write_json(cls.p.transcript, {"duration": total, "words": words_every(total)})
        write_json(cls.p.requirements, {"brief": {}, "rules": {}, "requirements": []})
        reel("cut", "-p", cls.p.root, "--no-silence", "--no-trim")
        reel("captions", "-p", cls.p.root)
        reel("props", "-p", cls.p.root)

    def plan(self, **extra):
        props = json.loads(self.p.props.read_text(encoding="utf-8"))
        props["editing_plan"] = {
            "overlay_scenes": [{"id": "card", "type": "glass_info_card", "title": "כותרת", "anchor": "top-center",
                                "start": 6.0, "end": 7.5}],
            "broll_scenes": [], "effects": [],
            "speaker_zooms": [{"anchor": 5.0, "start": 4.0, "end": 6.0, "peak": 1.05}],
            "sfx_placements": [{"timestamp_s": 6.0, "decision": "place", "file_path": "UI/x.mp3", "editorial_role": "hit",
                                "pre_lead_s": 0.0, "volume": {"gain": 0.5, "fade_in_s": 0, "fade_out_s": 0.3,
                                                               "duck_under_speech": False, "duck_amount_db": 0}}],
        }
        props.update(extra)
        write_json(self.p.props, props)

    def test_1_recut_keeps_string_anchor_and_moves_times_and_sfx(self):
        self.plan()
        reel("cut", "-p", self.p.root, "--no-silence", "--no-trim", "--remove", "1.0-2.0")
        props = json.loads(self.p.props.read_text(encoding="utf-8"))
        card = props["editing_plan"]["overlay_scenes"][0]
        self.assertEqual(card["anchor"], "top-center")
        self.assertAlmostEqual(card["start"], 5.0, delta=0.05)
        zoom = props["editing_plan"]["speaker_zooms"][0]
        self.assertAlmostEqual(zoom["anchor"], 4.0, delta=0.05)
        self.assertAlmostEqual(props["editing_plan"]["sfx_placements"][0]["timestamp_s"], 5.0, delta=0.05)

    def test_2_manual_removals_accumulate_and_can_be_restored(self):
        reel("cut", "-p", self.p.root, "--no-silence", "--no-trim", "--remove", "1.0-2.0")
        reel("cut", "-p", self.p.root, "--no-silence", "--no-trim", "--remove", "3.0-4.0")
        edit = json.loads(self.p.edit.read_text(encoding="utf-8"))
        kept = [tuple(k) for k in edit["keeps_frames"]]
        for a, b in ((30, 60), (90, 120)):
            self.assertFalse(any(s < b and a < e for s, e in kept), f"{a}-{b} came back: {kept}")
        listing = reel("cut", "-p", self.p.root, "--list").stdout
        self.assertIn("1.00-2.00", listing)
        self.assertIn("3.00-4.00", listing)
        reel("cut", "-p", self.p.root, "--no-silence", "--no-trim", "--restore", "1.0-2.0")
        kept = [tuple(k) for k in json.loads(self.p.edit.read_text(encoding="utf-8"))["keeps_frames"]]
        self.assertTrue(any(s <= 30 and 60 <= e for s, e in kept), f"1-2 not restored: {kept}")
        self.assertFalse(any(s < 120 and 90 < e for s, e in kept), f"3-4 lost on restore: {kept}")
        reel("cut", "-p", self.p.root, "--no-silence", "--no-trim", "--restore", "all")


@unittest.skipUnless(have_ffmpeg(), "ffmpeg missing")
class FinalizeFreshness(unittest.TestCase):
    def setUp(self):
        self.dir = tmpdir()
        clip = tone_clip(self.dir / "clip.mp4", [("tone", 1.5), ("silence", 0.2), ("tone", 1.5)])
        reel("init", clip, "--project", self.dir / "proj")
        self.p = Project(self.dir / "proj")
        write_json(self.p.transcript, {"duration": 3.2, "words": words_every(3.2)})
        write_json(self.p.requirements, {"brief": {}, "rules": {}, "requirements": []})
        reel("cut", "-p", self.p.root, "--no-silence", "--no-trim")
        reel("captions", "-p", self.p.root)
        reel("props", "-p", self.p.root)
        props = json.loads(self.p.props.read_text(encoding="utf-8"))
        props["rules"] = {"min_overlays": 0, "min_brolls": 0, "zoom_every_seconds": 0}
        write_json(self.p.props, props)
        self.out = self.p.output_dir / "reel.mp4"
        reel("render", "-p", self.p.root, "--tier", "fast", ok=False)   # auto QA may warn; report must exist
        review = json.loads((self.p.qa / "review.json").read_text(encoding="utf-8"))
        for it in review["items"]:
            if it["who"] == "model":
                it["status"], it["note"] = "pass", "test"
        write_json(self.p.qa / "review.json", review)

    def finalize(self):
        return reel("qa", "-p", self.p.root, "--finalize", ok=False)

    def test_fresh_report_finalizes(self):
        r = self.finalize()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_missing_output_is_rejected(self):
        self.out.unlink()
        r = self.finalize()
        self.assertNotEqual(r.returncode, 0)

    def test_replaced_output_is_rejected(self):
        self.out.write_bytes(self.out.read_bytes() + b"\0")
        r = self.finalize()
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("השתנה", r.stdout)

    def test_changed_plan_is_rejected(self):
        props = json.loads(self.p.props.read_text(encoding="utf-8"))
        props["captions_style"] = "classic"
        write_json(self.p.props, props)
        r = self.finalize()
        self.assertNotEqual(r.returncode, 0)

    def test_review_from_another_report_is_rejected(self):
        review = json.loads((self.p.qa / "review.json").read_text(encoding="utf-8"))
        review["report_id"] = "someone-else"
        write_json(self.p.qa / "review.json", review)
        self.assertNotEqual(self.finalize().returncode, 0)


@unittest.skipUnless(have_ffmpeg(), "ffmpeg missing")
class AudioPeaks(unittest.TestCase):
    """Open item closed 13.9: the real take reached the output at -0.4 dBFS."""

    def test_hot_peaks_are_limited_and_quiet_audio_is_untouched(self):
        from helpers import run
        from reelkit.media import finish_audio, probe, tool, true_peak_db
        d = tmpdir()
        hot = d / "hot.mp4"
        run([tool("ffmpeg"), "-y", "-v", "error", "-f", "lavfi", "-i", "color=gray:size=1080x1920:rate=30",
             "-f", "lavfi", "-i", "aevalsrc=0.98*sin(2*PI*220*t):s=48000", "-t", "2",
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", str(hot)])
        self.assertGreater(true_peak_db(hot), -1.0)
        frames = probe(hot)["frames"]
        import shutil
        original = d / "hot_original.mp4"
        shutil.copy(hot, original)
        res = finish_audio(hot)
        self.assertTrue(res["limited"])
        self.assertLessEqual(true_peak_db(hot), -0.9)
        self.assertEqual(probe(hot)["frames"], frames)
        from reelkit.qa import audio_offset_ms
        self.assertLessEqual(abs(audio_offset_ms(hot, original) or 0), 1.0, "the limiter shifted the audio")
        quiet = tone_clip(d / "quiet.mp4", [("tone", 1.5)], bframes=False, gop=30)
        before = quiet.read_bytes()
        self.assertFalse(finish_audio(quiet)["limited"])
        self.assertEqual(quiet.read_bytes(), before)


@unittest.skipUnless(have_ffmpeg(), "ffmpeg missing")
class FastTierCaptionOffset(unittest.TestCase):
    def test_offset_moves_fast_tier_captions(self):
        import importlib
        mc = importlib.import_module("make_captions")
        from PIL import Image
        d = tmpdir()
        cards = [{"start": 0.0, "end": 1.0, "text": "שלום לכולם", "words": ["שלום", "לכולם"], "emph": None}]

        def bottom(offset):
            out = d / f"o{offset}"
            entries = mc.render_cards(cards, None, out, 2.0, caption_offset=offset)
            box = Image.open(entries[0]["png"]).getbbox()
            return box[3]

        self.assertAlmostEqual(bottom(-120) - bottom(0), -120, delta=2)


if __name__ == "__main__":
    unittest.main()
