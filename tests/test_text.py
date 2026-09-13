"""Hebrew text + caption grouping (no ffmpeg needed)."""
import unittest

import helpers  # noqa: F401  (sets sys.path)
from reelkit import captions as C
from reelkit.hebrew import display_word, merge_number_tokens, spoken_numbers
from reelkit.timeline import build_keeps, remap_words, src_to_base, src_to_base_near


def W(tokens, step=0.3, gaps=None):
    gaps = gaps or {}
    out, t = [], 0.0
    for i, tok in enumerate(tokens):
        t += gaps.get(i, 0.0)
        out.append({"word": tok, "start": round(t, 3), "end": round(t + step - 0.04, 3)})
        t += step
    return out


class HebrewTokens(unittest.TestCase):
    def test_merges_whisper_number_fragments(self):
        m = merge_number_tokens(W(["-1", ",000", "צפיות", "80", "%"]))
        self.assertEqual([w["word"] for w in m], ["1,000", "צפיות", "80%"])

    def test_sentence_period_is_not_a_decimal(self):
        m = merge_number_tokens(W(["המספר", "3.", "5", "דברים"]))
        self.assertEqual([w["word"] for w in m], ["המספר", "3.", "5", "דברים"])

    def test_version_fragments_merge(self):
        m = merge_number_tokens(W(["גרסה", "5", ".1"]))
        self.assertEqual([w["word"] for w in m], ["גרסה", "5.1"])

    def test_display_word(self):
        self.assertEqual(display_word("לכולם,"), "לכולם")
        self.assertEqual(display_word("3."), "3")
        self.assertEqual(display_word("5.1"), "5.1")
        self.assertEqual(display_word("באמת?"), "באמת?")

    def test_spoken_numbers_digits_and_words(self):
        vals = [n["value"] for n in spoken_numbers(W(["הגעתי", "לעשרת", "אלפים", "צפיות", "ב", "3", "שבועות", "גרסה", "5.1"]))]
        self.assertIn(10000, vals)
        self.assertIn(3, vals)
        self.assertIn(5.1, vals)


class CaptionGroups(unittest.TestCase):
    STYLES = ["highlight", "fast"]

    def texts(self, tokens, **kw):
        return [g["text"] for g in C.build(W(tokens, **kw), self.STYLES, 60)]

    def assertTogether(self, groups, phrase):
        self.assertTrue(any(phrase in g for g in groups), f"'{phrase}' split across {groups}")

    def test_english_run_and_version_stay_together(self):
        g = self.texts("אני עובד עם Claude Code גרסה 5.1 כבר שבוע".split())
        self.assertTogether(g, "Claude Code")

    def test_latin_plus_number_stays_together(self):
        g = self.texts("עברתי ל GPT 5 אתמול בערב וזה שינה לי הכול".split())
        self.assertTogether(g, "GPT 5")

    def test_number_and_unit_stay_together(self):
        g = self.texts("זה לקח לי בדיוק 3 שניות לעשות את זה בפעם הראשונה".split())
        self.assertTogether(g, "3 שניות")
        g = self.texts("הגעתי לעשרת אלפים צפיות תוך שבוע אחד בלבד".split())
        self.assertTogether(g, "לעשרת אלפים צפיות")

    def test_prefix_letter_never_ends_a_group(self):
        for g in C.build(W("אני משתמש ב Notion כל יום בבוקר ובערב".split()), self.STYLES, 60):
            self.assertNotEqual(g["text"].split()[-1], "ב")

    def test_long_pause_breaks_group(self):
        groups = C.build(W(["שלום", "לכולם", "היום", "נדבר"], gaps={2: 1.4}), self.STYLES, 60)
        self.assertEqual([g["text"] for g in groups][0], "שלום לכולם")

    def test_every_group_fits_every_style(self):
        long = "זה משפט ארוך מאוד עם הרבה מילים ארוכות שממשיך וממשיך בלי שום הפסקה ובלי נשימה".split()
        for g in C.build(W(long, step=0.2), self.STYLES, 60):
            for st in self.STYLES:
                self.assertIsNone(C.overflow(g["text"].split(), st), (g["text"], st))

    def test_groups_never_overlap_and_times_follow_words(self):
        groups = C.build(W("אחד שתיים שלוש ארבע חמש שש שבע שמונה תשע עשר".split(), step=0.25), self.STYLES, 60)
        for a, b in zip(groups, groups[1:]):
            self.assertLessEqual(a["end"], b["start"] + 1e-6)
        for g in groups:
            self.assertEqual(g["start"], g["words"][0]["start"])

    def test_check_catches_edits_that_break_timing(self):
        words = W("שלום לכולם היום נדבר על עריכה".split())
        doc = C.document(C.build(words, self.STYLES, 10), self.STYLES, {"edit_id": "abc", "keeps_frames": [[0, 300]]}, 10)
        self.assertEqual(C.check(doc, words, 10, "abc", self.STYLES)[0], [])
        stale = C.check(doc, words, 10, "other", self.STYLES)[0]
        self.assertTrue(any("edit_id" in e for e in stale))
        shifted = [{**w, "start": w["start"] + 0.5, "end": w["end"] + 0.5} for w in words]
        self.assertTrue(C.check(doc, shifted, 10, "abc", self.STYLES)[0])
        doc["groups"][0]["emph"] = [9]
        self.assertTrue(any("emph" in e for e in C.check(doc, words, 10, "abc", self.STYLES)[0]))

    def test_retime_moves_groups_to_new_cut(self):
        words = W("שלום לכולם היום נדבר על עריכה".split())          # 0.0 … 1.8s
        old = {"edit_id": "old", "keeps_frames": [[0, 60]]}
        doc = C.document(C.build(words, self.STYLES, 2), self.STYLES, old, 2)
        new = {"edit_id": "new", "keeps_frames": [[9, 60]], "base": {"duration_seconds": 1.7}}
        moved, dropped = C.retime(doc, new)
        first = moved["groups"][0]["words"][0]
        self.assertEqual(first["word"], "לכולם")                  # "שלום" (0.0-0.26) fell in the new cut
        self.assertAlmostEqual(first["start"], 0.0, places=2)     # source 0.3 = new base 0.0
        self.assertEqual(dropped, 1)
        self.assertEqual(moved["edit_id"], "new")

    def test_retime_keeps_a_word_that_starts_exactly_at_a_join(self):
        """Regression 13.9: a word starting on a cut boundary was mapped back into the
        removed silence and dropped from the captions on the next cut."""
        old_keeps = [[8, 186], [231, 384]]
        words = [{"word": "קוד", "start": 5.5, "end": 5.9}, {"word": "תזכרו", "start": 5.933, "end": 6.573},
                 {"word": "את", "start": 6.573, "end": 6.773}]
        doc = C.document(C.build(words, self.STYLES, 10), self.STYLES, {"edit_id": "1", "keeps_frames": old_keeps}, 10)
        new = {"edit_id": "2", "keeps_frames": [[8, 186], [231, 292]], "base": {"duration_seconds": 8}}
        moved, dropped = C.retime(doc, new)
        self.assertEqual(dropped, 0)
        self.assertIn("תזכרו", [w["word"] for g in moved["groups"] for w in g["words"]])

    def test_protect_bonds_for_hooks(self):
        self.assertIn("לעשרת\u00a0אלפים", C.protect_bonds("איך הגעתי לעשרת אלפים צפיות"))
        self.assertIn("Claude\u00a0Code", C.protect_bonds("עם Claude Code היום"))
        self.assertIn(" לעשרת", C.protect_bonds("איך הגעתי לעשרת אלפים צפיות"))


class Timeline(unittest.TestCase):
    def test_keeps_and_mapping(self):
        keeps = build_keeps(300, 6, 294, [(3.0, 4.0)])
        self.assertEqual(keeps, [(6, 90), (120, 294)])
        self.assertAlmostEqual(src_to_base(4.5, keeps), (90 - 6) / 30 + 0.5, places=3)
        self.assertIsNone(src_to_base(3.5, keeps))
        self.assertAlmostEqual(src_to_base_near(3.5, keeps), (90 - 6) / 30, places=3)

    def test_words_inside_removed_range_are_dropped(self):
        keeps = [(0, 90), (120, 300)]
        out = remap_words([{"word": "a", "start": 1.0, "end": 1.2}, {"word": "b", "start": 3.2, "end": 3.6},
                           {"word": "c", "start": 5.0, "end": 5.3}], keeps)
        self.assertEqual([w["word"] for w in out], ["a", "c"])
        self.assertAlmostEqual(out[1]["start"], 4.0, places=3)


if __name__ == "__main__":
    unittest.main()
