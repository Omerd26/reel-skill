/**
 * Shared types for Remotion Reel rendering.
 * These match the JSON structure produced by Python's video_renderer.py.
 */

export interface SceneData {
  scene_number: number;
  duration_seconds: number;
  narration: string;
  screen_text: string;
  visual_description: string;
  image_path: string; // Absolute path or staticFile reference
  is_hook: boolean;
  is_cta: boolean;
}

export interface ReelProps {
  title: string;
  scenes: SceneData[];
  fps: number;
  style: string; // modern | bold | elegant | creative | dark
  brand_color: string; // "#E0701E"
}

/** Style-specific color themes */
export const STYLE_THEMES: Record<
  string,
  { accent: string; textShadow: string; overlayOpacity: number }
> = {
  modern: {
    accent: "#E0701E",
    textShadow: "0 2px 8px rgba(0,0,0,0.6)",
    overlayOpacity: 0.35,
  },
  bold: {
    accent: "#FF4500",
    textShadow: "0 3px 12px rgba(0,0,0,0.8)",
    overlayOpacity: 0.45,
  },
  elegant: {
    accent: "#C4941D",
    textShadow: "0 2px 6px rgba(0,0,0,0.5)",
    overlayOpacity: 0.3,
  },
  creative: {
    accent: "#8B5CF6",
    textShadow: "0 2px 10px rgba(0,0,0,0.7)",
    overlayOpacity: 0.4,
  },
  dark: {
    accent: "#E0701E",
    textShadow: "0 3px 15px rgba(0,0,0,0.9)",
    overlayOpacity: 0.55,
  },
};
