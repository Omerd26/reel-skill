/**
 * render_edit.mjs – Render an edited talking-head video using Remotion.
 *
 * Called from Python video_editor.py via subprocess.
 *
 * Usage:
 *   node render_edit.mjs --props <json_file> --output <output.mp4>
 *   node render_edit.mjs --test  (test render with placeholder props)
 *
 * Props JSON schema (matches EditedReelProps):
 * {
 *   video_path:       "videos/abc_input.mp4",  // relative to public/
 *   words:            [{word, start, end}, ...],
 *   duration_seconds: 45.2,
 *   editing_plan: {
 *     callouts:     [{start, end, text, position}, ...],
 *     lower_third:  {title, subtitle, start, duration},
 *     zoom_moments: [{start, duration, factor}, ...]
 *   },
 *   captions_style: "tiktok" | "classic" | "highlight" | "white_card" | "none",  // "none" = no burned captions
 *   fps: 30,
 *   brand_color: "#E0701E",
 *   instagram_handle: "@omerd"
 * }
 *
 * Output (last line of stdout): { success, output, duration_seconds }
 */

import { bundle }                        from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path                              from "path";
import fs                                from "fs";
import { fileURLToPath }                 from "url";
import { execSync }                      from "child_process";
import os                                from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── CLI arg parsing ───────────────────────────────────────────────────────────

function parseArgs() {
  const args   = process.argv.slice(2);
  const parsed = { propsFile: null, outputPath: null, test: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--props"  && args[i + 1]) parsed.propsFile  = args[++i];
    else if (args[i] === "--output" && args[i + 1]) parsed.outputPath = args[++i];
    else if (args[i] === "--test")  parsed.test = true;
  }
  return parsed;
}

// ── Video file preparation ────────────────────────────────────────────────────

function verifyVideoExists(props) {
  /**
   * Make sure the video file exists in public/.
   * If video_path is absolute, copy it to public/videos/.
   * Returns updated video_path (relative).
   */
  const videosDir = path.join(__dirname, "public", "videos");
  fs.mkdirSync(videosDir, { recursive: true });

  const relPath = props.video_path;

  // If it looks like an absolute path, copy it in
  if (path.isAbsolute(relPath)) {
    const filename = path.basename(relPath);
    const dest     = path.join(videosDir, filename);
    if (!fs.existsSync(dest)) fs.copyFileSync(relPath, dest);
    return `videos/${filename}`;
  }

  // Check relative path exists
  const absPath = path.join(__dirname, "public", relPath);
  if (!fs.existsSync(absPath)) {
    console.error(`[render_edit] Warning: video not found at ${absPath}`);
  }
  return relPath;
}

// ── Test props ────────────────────────────────────────────────────────────────

function getTestProps() {
  return {
    video_path:       "videos/placeholder_video.mp4",
    words: [
      { word: "שלום",   start: 0.0, end: 0.4 },
      { word: "לכולם",  start: 0.5, end: 1.0 },
      { word: "היום",   start: 1.1, end: 1.5 },
      { word: "אני",    start: 1.6, end: 1.8 },
      { word: "הולך",   start: 1.9, end: 2.2 },
      { word: "לשתף",   start: 2.3, end: 2.7 },
      { word: "טיפ",    start: 2.8, end: 3.0 },
      { word: "חשוב",   start: 3.1, end: 3.5 },
    ],
    duration_seconds: 6,
    editing_plan: {
      callouts: [
        { start: 2.5, end: 5.0, text: "💡 טיפ חשוב!", position: "top" },
      ],
      lower_third: {
        title:    "@omerd",
        subtitle: "מומחה שיווק",
        start:    0,
        duration: 5,
      },
      zoom_moments: [
        { start: 3.0, duration: 1.5, factor: 1.06 },
      ],
    },
    captions_style:   "tiktok",
    fps:              30,
    brand_color:      "#E0701E",
    instagram_handle: "@omerd",
  };
}

function createPlaceholderVideo() {
  /**
   * Create a short placeholder MP4 for test mode.
   * Uses Remotion's bundled FFmpeg with a looped PNG frame (the -f lavfi
   * color filter is disabled in the Remotion build, so we generate a PNG
   * via Python first and loop it into H.264 video).
   */
  const videosDir  = path.join(__dirname, "public", "videos");
  fs.mkdirSync(videosDir, { recursive: true });
  const outputPath = path.join(videosDir, "placeholder_video.mp4");

  if (fs.existsSync(outputPath)) return;

  // Locate Remotion's bundled ffmpeg (darwin-arm64 or darwin-x64 or linux-x64)
  const compositorDirs = fs.readdirSync(
    path.join(__dirname, "node_modules", "@remotion")
  ).filter(d => d.startsWith("compositor-"));

  const ffmpegBin = compositorDirs
    .map(d => path.join(__dirname, "node_modules", "@remotion", d, "ffmpeg"))
    .find(p => fs.existsSync(p));

  if (!ffmpegBin) {
    console.error("[render_edit] Could not find Remotion ffmpeg binary");
    return;
  }

  const libDir = path.dirname(ffmpegBin);

  try {
    // 1. Create a 1080×1920 dark PNG via Python
    const pngPath = path.join(os.tmpdir(), "placeholder_frame.png");
    execSync(
      `python3 -c "
from PIL import Image
img = Image.new('RGB', (1080, 1920), (20, 20, 20))
img.save('${pngPath}')
"`,
      { stdio: "pipe" }
    );

    // 2. Loop the PNG into a 6-second H.264 MP4
    const env = { ...process.env, DYLD_LIBRARY_PATH: libDir, LD_LIBRARY_PATH: libDir };
    execSync(
      `"${ffmpegBin}" -y -loop 1 -framerate 30 -i "${pngPath}" -t 6 -c:v libx264 -pix_fmt yuv420p "${outputPath}"`,
      { stdio: "pipe", env }
    );
    console.error("[render_edit] Placeholder video created:", outputPath);
  } catch (e) {
    console.error("[render_edit] Could not create placeholder video:", e.message);
  }
}

// ── Bundle cache ──────────────────────────────────────────────────────────────
// webpack compilation takes 15-30s; cache the result and reuse across renders.

const BUNDLE_CACHE_FILE = path.join(__dirname, ".bundle-cache.json");

function getMaxMtime(dir) {
  let max = 0;
  const walk = (d) => {
    try {
      for (const name of fs.readdirSync(d)) {
        const full = path.join(d, name);
        try {
          const stat = fs.statSync(full);
          if (stat.isDirectory()) walk(full);
          else if (stat.mtimeMs > max) max = stat.mtimeMs;
        } catch { /* skip unreadable */ }
      }
    } catch { /* skip unreadable dir */ }
  };
  walk(dir);
  return max;
}

async function getBundle() {
  const srcDir    = path.join(__dirname, "src");
  const srcMtime  = getMaxMtime(srcDir);

  // Try cached bundle
  if (fs.existsSync(BUNDLE_CACHE_FILE)) {
    try {
      const cache = JSON.parse(fs.readFileSync(BUNDLE_CACHE_FILE, "utf8"));
      if (
        cache.location &&
        fs.existsSync(path.join(cache.location, "index.html")) &&
        srcMtime <= cache.srcMtime
      ) {
        console.error("[render_edit] ✓ Using cached bundle (webpack skipped)");
        return cache.location;
      }
    } catch { /* cache invalid */ }
  }

  // Fresh bundle
  console.error("[render_edit] Building bundle (first time or source changed)...");
  const location = await bundle({
    entryPoint:      path.join(srcDir, "index.ts"),
    publicDir:       path.join(__dirname, "public"),
    webpackOverride: (config) => config,
  });

  try {
    fs.writeFileSync(BUNDLE_CACHE_FILE, JSON.stringify({ location, srcMtime }));
    console.error(`[render_edit] Bundle saved to cache`);
  } catch { /* non-fatal */ }

  return location;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { propsFile, outputPath, test } = parseArgs();

  let props;
  let output;

  if (test) {
    output = outputPath || path.join(__dirname, "..", "output", "test_edited.mp4");
    await createPlaceholderVideo();
    props = getTestProps();
    console.error("[render_edit] Running in test mode...");
  } else {
    if (!propsFile || !outputPath) {
      console.error("Usage: node render_edit.mjs --props <json> --output <mp4>");
      process.exit(1);
    }
    output = outputPath;
    const rawJson = fs.readFileSync(propsFile, "utf-8");
    props = JSON.parse(rawJson);

    // Ensure video is accessible
    props.video_path = verifyVideoExists(props);
  }

  const totalSeconds = props.duration_seconds || 10;
  const fps          = props.fps || 30;
  const totalFrames  = Math.ceil(totalSeconds * fps);

  console.error(`[render_edit] Duration: ${totalSeconds}s (${totalFrames} frames)`);
  console.error(`[render_edit] Captions: ${props.captions_style}`);
  console.error(`[render_edit] Callouts: ${props.editing_plan?.callouts?.length || 0}`);
  console.error(`[render_edit] Output:   ${output}`);

  fs.mkdirSync(path.dirname(output), { recursive: true });

  // Bundle (cached after first run)
  const bundleLocation = await getBundle();

  // Remotion bundles the public/ dir at webpack time, so new files added
  // after the bundle was built are NOT served by the bundle's HTTP server.
  // Fix: always sync videos and icons into the bundle's public/ dir.
  if (!test) {
    const srcVideo  = path.join(__dirname, "public", props.video_path);
    const destVideo = path.join(bundleLocation, "public", props.video_path);
    if (fs.existsSync(srcVideo) && !fs.existsSync(destVideo)) {
      fs.mkdirSync(path.dirname(destVideo), { recursive: true });
      fs.copyFileSync(srcVideo, destVideo);
      console.error(`[render_edit] Synced video into bundle: ${path.basename(props.video_path)}`);
    }

    // Sync icon PNGs into the bundle
    const iconsDir = path.join(__dirname, "public", "icons");
    const destIconsDir = path.join(bundleLocation, "public", "icons");
    if (fs.existsSync(iconsDir)) {
      fs.mkdirSync(destIconsDir, { recursive: true });
      for (const f of fs.readdirSync(iconsDir)) {
        const src = path.join(iconsDir, f);
        const dst = path.join(destIconsDir, f);
        if (!fs.existsSync(dst)) {
          fs.copyFileSync(src, dst);
        }
      }
      console.error(`[render_edit] Synced icons into bundle`);
    }

    // Sync audio asset dirs (music beds + SFX) into the bundle. Both are
    // staticFile('music/<mood>/…') / staticFile('sfx/<cat>/…') paths added
    // after the bundle was built, so — exactly like video/icons — they must be
    // copied into the bundle's public/ dir or they 404 at render time (Remotion
    // bakes public/ at webpack time). Recursive because these have subfolders;
    // overwrite (default force) so a swapped/re-curated track refreshes.
    for (const audioDir of ["music", "sfx"]) {
      const srcDir  = path.join(__dirname, "public", audioDir);
      const destDir = path.join(bundleLocation, "public", audioDir);
      if (fs.existsSync(srcDir)) {
        fs.cpSync(srcDir, destDir, { recursive: true });
        console.error(`[render_edit] Synced ${audioDir} into bundle`);
      }
    }
  }

  // Select composition
  console.error("[render_edit] Selecting composition...");
  const chromeFlags = {
    gl: process.env.REMOTION_GL || "swiftshader",
    enableMultiProcessOnLinux: true,
  };
  const composition = await selectComposition({
    serveUrl:   bundleLocation,
    id:         "EditedReel",
    inputProps: props,
    chromiumOptions: chromeFlags,
    timeoutInMilliseconds: 120000,  // 2 min for browser setup in Docker
  });

  // Render — use more CPU cores + lighter settings for speed
  console.error("[render_edit] Rendering...");
  await renderMedia({
    composition,
    serveUrl:       bundleLocation,
    codec:          "h264",
    outputLocation: output,
    inputProps:     props,
    imageFormat:    "jpeg",
    // COLOR PIPELINE (2026-08-05). Without this every export came out
    // `yuvj420p / color_range=pc / bt470bg / transfer=unknown`: FULL-range
    // pixels (inherited from the JPEG frame capture) carrying PAL primaries
    // and no transfer tag, while the customer's own iPhone source is the
    // correct `yuv420p / tv / bt709`. Any player or transcoder that assumes
    // limited range — Instagram's included — then shifts the picture
    // (crushed blacks or washed-out contrast) and the colours drift off
    // bt709. "bt709" makes Remotion tag primaries/transfer/matrix properly
    // and emit limited-range yuv420p, i.e. what every phone actually shoots.
    colorSpace:     "bt709",
    // Quality-first export. These two were dropped to 75/23 "for speed", but
    // that's exactly what made the saved MP4 look softer than the browser
    // preview: the preview streams the ORIGINAL source file, while the export
    // captures every composited frame (footage + captions) as JPEG then
    // re-encodes with H264. jpegQuality controls that intermediate capture —
    // at 75 it softens the talking-head footage before encoding even starts.
    // jpeg 100 = near-lossless capture; crf 18 = visually-lossless H264. Both
    // env-overridable so we can trade quality↔speed without a redeploy.
    jpegQuality:    process.env.RENDER_JPEG_QUALITY ? parseInt(process.env.RENDER_JPEG_QUALITY) : 100,
    crf:            process.env.RENDER_CRF ? parseInt(process.env.RENDER_CRF) : 18,
    // Left at the default "medium" preset — "slow" gains only marginal
    // quality-per-bit but ~+60% encode CPU on this 4-core box, risking
    // render timeouts. Bump via env only if a box has spare cores.
    x264Preset:     process.env.RENDER_X264_PRESET || "medium",
    // Concurrency=2 on a 4-core box. We tried 4, but each worker has to decode
    // the source video via OffthreadVideo's bundled ffmpeg, and 4 concurrent
    // decodes saturated the CPU enough that some frames timed out and reused
    // the previous decoded frame — that's what caused the user-visible "source
    // freezes for 2s then catches up" stutter. Halving concurrency doubles
    // per-worker headroom for decoding at only a ~30% wall-clock cost.
    concurrency:    process.env.RENDER_CONCURRENCY ? parseInt(process.env.RENDER_CONCURRENCY) : 2,
    timeoutInMilliseconds: 90000,  // 90s per frame (video loading can be slow in Docker)
    chromiumOptions: chromeFlags,
    onProgress: ({ progress }) => {
      const pct    = Math.round(progress * 100);
      const filled = Math.floor(pct / 10);
      const bar    = "▓".repeat(filled) + "░".repeat(10 - filled);
      console.error(`[render_edit] Progress: ${bar} ${pct}%`);
    },
  });

  // Bundle is kept (cached) — NOT deleted after render

  const result = {
    success:          true,
    output:           path.resolve(output),
    duration_seconds: totalSeconds,
    frames:           totalFrames,
  };
  console.log(JSON.stringify(result));
}

main().catch((err) => {
  console.log(JSON.stringify({ success: false, error: err.message || String(err) }));
  process.exit(1);
});
