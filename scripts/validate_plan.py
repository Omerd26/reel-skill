#!/usr/bin/env python3
"""Plan validator — catches the mistakes that produce a broken video BEFORE a render burns.

Usage:  python3 scripts/validate_plan.py <project>/work/props.json [--project <project>]

Exit 0 = ready to render. Exit 1 = errors printed (fix and re-run).
Warnings never block, but read them. Creative limits are defaults that
props["rules"] can override (see docs/PLAYBOOK.md). Same checks as `reel validate`.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from reelkit.validate import validate  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("props")
    ap.add_argument("--project")
    ap.add_argument("--no-files", action="store_true", help="skip file/duration checks")
    a = ap.parse_args()
    rep = validate(a.props, a.project, check_files=not a.no_files)
    for w in rep.warns:
        print(f"⚠️  {w}")
    for e in rep.errors:
        print(f"❌ {e}")
    if rep.errors:
        print(f"\n{len(rep.errors)} שגיאות — תקן ב-props.json והרץ שוב.")
        return 1
    print(f"✅ התוכנית תקינה ({len(rep.warns)} אזהרות) — אפשר לרנדר.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
