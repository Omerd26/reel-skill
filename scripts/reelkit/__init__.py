"""Shared building blocks for the reel skill scripts.

Every CLI in scripts/ imports from here so both render tiers (ffmpeg fast tier
and Remotion full tier) agree on paths, timelines, caption groups and checks.
"""
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent.parent
FPS = 30
WIDTH, HEIGHT = 1080, 1920
