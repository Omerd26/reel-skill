"""The instructions and examples must match the code exactly."""
import json
import re
import shutil
import subprocess
import sys
import unittest

from helpers import ROOT, tmpdir, write_json
from reelkit import captions as C
from reelkit import validate as V

SKILL = (ROOT / "skills" / "reel" / "SKILL.md").read_text(encoding="utf-8")
SCENES = (ROOT / "docs" / "SCENES.md").read_text(encoding="utf-8")
PLAYBOOK = (ROOT / "docs" / "PLAYBOOK.md").read_text(encoding="utf-8")


def reel_help(*args) -> str:
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "reel.py"), *args, "--help"],
                       capture_output=True, text=True)
    return r.stdout


class SkillCopies(unittest.TestCase):
    def test_plugin_and_clone_copies_are_identical(self):
        for f in ("SKILL.md", "reel"):
            a = (ROOT / "skills" / "reel" / f).read_bytes()
            b = (ROOT / ".claude" / "skills" / "reel" / f).read_bytes()
            self.assertEqual(a, b, f"{f} differs between skills/reel and .claude/skills/reel")

    def test_no_stale_path_tricks(self):
        self.assertNotIn("CLAUDE_PLUGIN_ROOT:-", SKILL, "CLAUDE_PLUGIN_ROOT is not an env var in Bash")
        self.assertNotIn("$(pwd)/work", SKILL, "$(pwd) after cd pointed into remotion/")
        self.assertNotIn("videos/cut.mp4", SKILL)

    def test_launcher_finds_reel_py(self):
        r = subprocess.run(["sh", str(ROOT / ".claude" / "skills" / "reel" / "reel"), "root"],
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(r.stdout.strip(), str(ROOT))


class CommandsExist(unittest.TestCase):
    def test_every_documented_command_and_flag_exists(self):
        docs = SKILL + (ROOT / "CLAUDE.md").read_text(encoding="utf-8")
        calls = re.findall(r'/reel"?\s+([a-z]+)([^\n`]*)', docs) + re.findall(r'`reel ([a-z]+)([^`]*)`', docs)
        self.assertGreater(len(calls), 10)
        choices = re.search(r"\{([a-z,]+)\}", reel_help()).group(1).split(",")
        for cmd, rest in calls:
            self.assertIn(cmd, choices, f"documented command '{cmd}' does not exist")
            helptext = reel_help(cmd)
            for flag in re.findall(r"--[a-z][a-z-]+", rest):
                self.assertIn(flag, helptext, f"'reel {cmd}' has no flag {flag}")


class ExamplesValidate(unittest.TestCase):
    def setUp(self):
        self.props = json.loads((ROOT / "templates" / "props.example.json").read_text(encoding="utf-8"))
        self.req = json.loads((ROOT / "templates" / "requirements.example.json").read_text(encoding="utf-8"))
        self.caps = json.loads((ROOT / "templates" / "captions.example.json").read_text(encoding="utf-8"))

    def project(self, props):
        d = tmpdir()
        (d / "work").mkdir()
        write_json(d / "project.json", {"stages": {}})
        write_json(d / "work" / "props.json", props)
        write_json(d / "work" / "requirements.json", self.req)
        write_json(d / "work" / "edit.json", {"edit_id": props["edit_id"], "keeps_frames": props["keeps_frames"],
                                              "base": {"path": "/nonexistent", "fingerprint": "x"}})
        return d

    def test_props_example_with_requirements_is_valid(self):
        d = self.project(self.props)
        rep = V.validate(d / "work" / "props.json", d, check_files=False)
        self.assertEqual(rep.errors, [])

    def test_captions_example_is_valid(self):
        errs, _ = C.check(self.caps, self.props["words"], self.props["duration_seconds"],
                          self.props["edit_id"], ["highlight", "fast"])
        self.assertEqual(errs, [])

    def test_scenes_md_custom_layers_example_is_valid(self):
        block = SCENES.split("## סצנה מותאמת")[1].split("```json")[1].split("```")[0]
        scene = json.loads(block)
        props = dict(self.props)
        props["editing_plan"] = {"overlay_scenes": [scene], "broll_scenes": []}
        d = self.project(props)
        rep = V.validate(d / "work" / "props.json", d, check_files=False)
        self.assertEqual([e for e in rep.errors if "custom_layers" in e or "remember3" in e], [])

    def test_skill_requirements_example_parses(self):
        block = SKILL.split("## 3 · הבנה")[1].split("```json")[1].split("```")[0]
        data = json.loads(block)
        for q in data["requirements"]:
            self.assertIn(q["status"], ("planned", "done", "rejected"))

    def test_rules_and_variants_in_docs_match_code(self):
        for key in V.DEFAULT_RULES:
            self.assertIn(f"`{key}`", SKILL, f"rule {key} undocumented in SKILL.md")
        for v in V.HOOK_VARIANTS:
            self.assertIn(v, SKILL)
            self.assertIn(v, PLAYBOOK)
        anchor_rows = SCENES.split("| anchor |")[1].split("\n\n")[0]
        self.assertEqual(set(re.findall(r"`([a-z-]+)`", anchor_rows)), V.ANCHORS)
        enter_row = next(line for line in SCENES.splitlines() if line.startswith("| `enter`"))
        self.assertEqual(set(re.findall(r"`([a-z-]+)`", enter_row)) - {"enter"}, V.ENTERS)


if __name__ == "__main__":
    unittest.main()
