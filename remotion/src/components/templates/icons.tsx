/**
 * Template icon registry — semantic icon mapping for tier rating + bracket templates.
 *
 * Each `TemplateIconId` is a stable name that the Python planner emits.
 * Resolution happens here in TS, so we can swap the underlying lucide icon
 * without touching plans.
 *
 * Style is intentionally constrained — bold white stroke SVGs only, so a row
 * of rated items reads as a single visual family.
 *
 * To add a new icon: add an entry to ICON_MAP + add the id to TemplateIconId.
 * To override how an item name gets mapped to an id, edit `_LOOKUP` in the
 * Python planner (`template_agent/icons.py`).
 *
 * KEEP IN LOCKSTEP with `template_agent/icons.py::KNOWN_IDS` — the Python
 * planner validates icon ids against that set BEFORE emitting them, so an
 * id that exists here but not there will be dropped.
 */

import React from "react";
import * as LucideIcons from "lucide-react";

// ── Stable IDs (Python-side mirror lives in template_agent/icons.py) ─────────

export type TemplateIconId =
  // ── Content / media ────────────────────────────────────────────────────────
  | "hook" | "script" | "caption" | "hashtag" | "music" | "podcast" | "vinyl"
  | "headphones" | "speaker" | "radio" | "tv"
  // ── Production gear ────────────────────────────────────────────────────────
  | "camera" | "microphone" | "image" | "lighting" | "editing" | "monitor"
  // ── Strategy / concepts ────────────────────────────────────────────────────
  | "idea" | "value" | "diamond" | "structure" | "format"
  | "cta" | "awareness" | "angle" | "topic" | "length" | "growth"
  // ── Time ───────────────────────────────────────────────────────────────────
  | "clock" | "calendar" | "posting-time" | "timer" | "alarm" | "hourglass"
  // ── UI symbols ─────────────────────────────────────────────────────────────
  | "trending-up" | "trending-down" | "users" | "user" | "heart" | "star"
  | "play" | "pause" | "checkmark" | "cross" | "fire"
  | "rocket" | "target" | "trophy" | "lightning" | "lightbulb"
  | "lock" | "unlock" | "search" | "filter" | "plus" | "minus"
  // ── Money / business ───────────────────────────────────────────────────────
  | "dollar" | "money" | "wallet" | "bank" | "credit-card"
  | "briefcase" | "building" | "store" | "shopping-bag" | "shopping-cart"
  | "package" | "gift" | "chart" | "pie-chart" | "line-chart"
  // ── Tech ───────────────────────────────────────────────────────────────────
  | "laptop" | "phone" | "smartphone" | "server" | "code" | "terminal"
  | "wifi" | "bluetooth" | "plug" | "cpu" | "database" | "cloud-tech"
  // ── Communication ──────────────────────────────────────────────────────────
  | "mail" | "message" | "chat" | "share" | "send" | "bell" | "link"
  // ── Travel ─────────────────────────────────────────────────────────────────
  | "plane" | "car" | "map" | "location" | "globe" | "hotel" | "bed"
  // ── Food / drink ───────────────────────────────────────────────────────────
  | "coffee" | "pizza" | "beer" | "wine" | "apple" | "utensils" | "salad"
  // ── Fitness / sports ───────────────────────────────────────────────────────
  | "dumbbell" | "bike" | "activity" | "ball"
  // ── Apparel / lifestyle ────────────────────────────────────────────────────
  | "shirt" | "watch" | "glasses" | "umbrella"
  // ── Nature / weather ───────────────────────────────────────────────────────
  | "sun" | "moon" | "cloud" | "rain" | "tree" | "flower" | "leaf"
  // ── Tools ──────────────────────────────────────────────────────────────────
  | "wrench" | "hammer" | "settings" | "key" | "scissors"
  // ── Health ─────────────────────────────────────────────────────────────────
  | "pill" | "stethoscope" | "hospital" | "shield"
  // ── Education ──────────────────────────────────────────────────────────────
  | "book" | "graduation" | "pencil" | "calculator" | "microscope" | "globe-edu"
  // ── Generic ────────────────────────────────────────────────────────────────
  | "thumbs-up" | "thumbs-down" | "smile" | "frown" | "alert" | "info"
  | "tag" | "bookmark" | "flag" | "crown" | "magic-wand";

// ── Mapping IDs → lucide component names ─────────────────────────────────────

const ICON_MAP: Record<TemplateIconId, keyof typeof LucideIcons> = {
  // Content / media
  "hook":         "Anchor",
  "script":       "FileText",
  "caption":      "Captions",
  "hashtag":      "Hash",
  "music":        "Music",
  "podcast":      "Mic2",
  "vinyl":        "Disc",
  "headphones":   "Headphones",
  "speaker":      "Speaker",
  "radio":        "Radio",
  "tv":           "Tv",
  // Production gear
  "camera":       "Video",
  "microphone":   "Mic",
  "image":        "Image",
  "lighting":     "Lightbulb",
  "editing":      "Scissors",
  "monitor":      "Monitor",
  // Strategy / concepts
  "idea":         "Lightbulb",
  "value":        "Gem",
  "diamond":      "Gem",
  "structure":    "LayoutGrid",
  "format":       "LayoutPanelTop",
  "cta":          "MousePointerClick",
  "awareness":    "Eye",
  "angle":        "Compass",
  "topic":        "Tag",
  "length":       "Ruler",
  "growth":       "TrendingUp",
  // Time
  "clock":        "Clock",
  "calendar":     "Calendar",
  "posting-time": "CalendarClock",
  "timer":        "Timer",
  "alarm":        "AlarmClock",
  "hourglass":    "Hourglass",
  // UI symbols
  "trending-up":   "TrendingUp",
  "trending-down": "TrendingDown",
  "users":         "Users",
  "user":          "User",
  "heart":         "Heart",
  "star":          "Star",
  "play":          "Play",
  "pause":         "Pause",
  "checkmark":     "Check",
  "cross":         "X",
  "fire":          "Flame",
  "rocket":        "Rocket",
  "target":        "Target",
  "trophy":        "Trophy",
  "lightning":     "Zap",
  "lightbulb":     "Lightbulb",
  "lock":          "Lock",
  "unlock":        "Unlock",
  "search":        "Search",
  "filter":        "Filter",
  "plus":          "Plus",
  "minus":         "Minus",
  // Money / business
  "dollar":        "DollarSign",
  "money":         "Banknote",
  "wallet":        "Wallet",
  "bank":          "Landmark",
  "credit-card":   "CreditCard",
  "briefcase":     "Briefcase",
  "building":      "Building2",
  "store":         "Store",
  "shopping-bag":  "ShoppingBag",
  "shopping-cart": "ShoppingCart",
  "package":       "Package",
  "gift":          "Gift",
  "chart":         "BarChart3",
  "pie-chart":     "PieChart",
  "line-chart":    "LineChart",
  // Tech
  "laptop":        "Laptop",
  "phone":         "Phone",
  "smartphone":    "Smartphone",
  "server":        "Server",
  "code":          "Code",
  "terminal":      "Terminal",
  "wifi":          "Wifi",
  "bluetooth":     "Bluetooth",
  "plug":          "Plug",
  "cpu":           "Cpu",
  "database":      "Database",
  "cloud-tech":    "Cloud",
  // Communication
  "mail":          "Mail",
  "message":       "MessageCircle",
  "chat":          "MessageSquare",
  "share":         "Share2",
  "send":          "Send",
  "bell":          "Bell",
  "link":          "Link",
  // Travel
  "plane":         "Plane",
  "car":           "Car",
  "map":           "Map",
  "location":      "MapPin",
  "globe":         "Globe",
  "hotel":         "Hotel",
  "bed":           "Bed",
  // Food / drink
  "coffee":        "Coffee",
  "pizza":         "Pizza",
  "beer":          "Beer",
  "wine":          "Wine",
  "apple":         "Apple",
  "utensils":      "Utensils",
  "salad":         "Salad",
  // Fitness / sports
  "dumbbell":      "Dumbbell",
  "bike":          "Bike",
  "activity":      "Activity",
  "ball":          "Volleyball",
  // Apparel / lifestyle
  "shirt":         "Shirt",
  "watch":         "Watch",
  "glasses":       "Glasses",
  "umbrella":      "Umbrella",
  // Nature / weather
  "sun":           "Sun",
  "moon":          "Moon",
  "cloud":         "Cloud",
  "rain":          "CloudRain",
  "tree":          "TreePine",
  "flower":        "Flower",
  "leaf":          "Leaf",
  // Tools
  "wrench":        "Wrench",
  "hammer":        "Hammer",
  "settings":      "Settings",
  "key":           "Key",
  "scissors":      "Scissors",
  // Health
  "pill":          "Pill",
  "stethoscope":   "Stethoscope",
  "hospital":      "Hospital",
  "shield":        "Shield",
  // Education
  "book":          "Book",
  "graduation":    "GraduationCap",
  "pencil":        "Pencil",
  "calculator":    "Calculator",
  "microscope":    "Microscope",
  "globe-edu":     "Globe2",
  // Generic
  "thumbs-up":     "ThumbsUp",
  "thumbs-down":   "ThumbsDown",
  "smile":         "Smile",
  "frown":         "Frown",
  "alert":         "AlertCircle",
  "info":          "Info",
  "tag":           "Tag",
  "bookmark":      "Bookmark",
  "flag":          "Flag",
  "crown":         "Crown",
  "magic-wand":    "Sparkles",
};

// Fallback when an icon id is unknown
const FALLBACK_LUCIDE: keyof typeof LucideIcons = "Square";

// ── Public API ───────────────────────────────────────────────────────────────

export interface TemplateIconProps {
  id: TemplateIconId | string | undefined;
  size?: number;
  color?: string;
  strokeWidth?: number;
  mode?: "stroke" | "filled";
  style?: React.CSSProperties;
}

export const TemplateIcon: React.FC<TemplateIconProps> = ({
  id,
  size = 96,
  color = "#FFFFFF",
  strokeWidth = 2.4,
  mode = "stroke",
  style,
}) => {
  const lucideName = (id && ICON_MAP[id as TemplateIconId]) || FALLBACK_LUCIDE;
  const Comp = LucideIcons[lucideName] as React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
    fill?: string;
    style?: React.CSSProperties;
  }>;
  if (!Comp) return null;

  return (
    <Comp
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      fill={mode === "filled" ? color : "none"}
      style={style}
    />
  );
};

export function isKnownIcon(id: string): id is TemplateIconId {
  return id in ICON_MAP;
}

export const ALL_TEMPLATE_ICONS: TemplateIconId[] = Object.keys(
  ICON_MAP,
) as TemplateIconId[];
