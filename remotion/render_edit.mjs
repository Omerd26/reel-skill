/**
 * render_edit.mjs – Render an edited talking-head video using Remotion.
 *
 * Usage (any working directory — nothing here depends on cwd):
 *   node render_edit.mjs --props <props.json> --output <output.mp4>
 *   node render_edit.mjs --test  (test render with placeholder props)
 *
 * Paths inside props (video_path, music.src, scene src/image_url/video_url):
 *   • absolute path                         → used as is
 *   • relative path that exists next to the props file → resolved against it
 *   • relative path under remotion/public   → legacy (e.g. "music/calm/x.mp3")
 * Every LOCAL file is staged into the bundle under a CONTENT-HASHED name
 * (videos/src-<sha1>.mp4). Same name + new content = new URL, so a replaced
 * file can never be served from a previous render (the old sync copied a file
 * only "if it didn't exist yet" — a re-cut base.mp4 rendered the OLD video).
 * A referenced file that does not exist is a hard error, not a warning.
 *
 * Duration: duration_frames if given, else round(duration_seconds * fps).
 * No hidden buffer — the output has exactly that many frames.
 *
 * Output (last line of stdout): { success, output, frames, duration_seconds, staged }
 */

import { bundle }                        from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path                              from "path";
import fs                                from "fs";
import crypto                            from "crypto";
import { fileURLToPath }                 from "url";
import { execSync, execFileSync }        from "child_process";
import os                                from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, "public");

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

// ── Local asset resolution + content-hashed staging ─────────────────────────

class AssetError extends Error {}

function isRemote(p) {
  return typeof p === "string" && /^(https?:|data:)/.test(p);
}

/** Absolute path of a local asset referenced from props, or throws. */
export function resolveLocal(ref, propsDir, what) {
  if (!ref || typeof ref !== "string") throw new AssetError(`${what}: empty path`);
  const expanded = ref.startsWith("~") ? path.join(os.homedir(), ref.slice(1)) : ref;
  const candidates = path.isAbsolute(expanded)
    ? [expanded]
    : [path.join(propsDir, expanded), path.join(PUBLIC_DIR, expanded)];
  const hit = candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
  if (!hit) throw new AssetError(`${what}: file not found: ${ref} (looked in ${candidates.join(" , ")})`);
  return hit;
}

function sha1File(file) {
  const h = crypto.createHash("sha1");
  const fd = fs.openSync(file, "r");
  const buf = Buffer.alloc(1 << 20);
  try {
    let n;
    while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) h.update(buf.subarray(0, n));
  } finally {
    fs.closeSync(fd);
  }
  return h.digest("hex").slice(0, 16);
}

/** Copy into <bundle>/public/<folder>/<prefix>-<hash><ext>; returns the staticFile path. */
function stage(absFile, bundleLocation, folder, prefix) {
  const hash = sha1File(absFile);
  const ext = path.extname(absFile).toLowerCase() || ".bin";
  const rel = `${folder}/${prefix}-${hash}${ext}`;
  const dest = path.join(bundleLocation, "public", rel);
  if (!fs.existsSync(dest) || fs.statSync(dest).size !== fs.statSync(absFile).size) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(absFile, dest);
  }
  return { rel, hash };
}

const MEDIA_KEYS = new Set(["src", "image_url", "video_url", "icon_src"]);

/** Resolve + stage every local file the props reference. Mutates props. */
function stageAssets(props, propsDir, bundleLocation) {
  const staged = [];
  const v = stage(resolveLocal(props.video_path, propsDir, "video_path"), bundleLocation, "videos", "src");
  staged.push({ field: "video_path", from: props.video_path, to: v.rel });
  props.video_path = v.rel;

  if (props.music && props.music.src && !isRemote(props.music.src)) {
    const m = stage(resolveLocal(props.music.src, propsDir, "music.src"), bundleLocation, "staged-audio", "music");
    staged.push({ field: "music.src", from: props.music.src, to: m.rel });
    props.music.src = m.rel;
  }

  const walk = (node, where) => {
    if (Array.isArray(node)) { node.forEach((n, i) => walk(n, `${where}[${i}]`)); return; }
    if (!node || typeof node !== "object") return;
    for (const [k, val] of Object.entries(node)) {
      if (MEDIA_KEYS.has(k) && typeof val === "string" && val && !isRemote(val)) {
        const s = stage(resolveLocal(val, propsDir, `${where}.${k}`), bundleLocation, "staged-media", "m");
        staged.push({ field: `${where}.${k}`, from: val, to: s.rel });
        node[k] = s.rel;
      } else if (val && typeof val === "object") {
        walk(val, `${where}.${k}`);
      }
    }
  };
  walk(props.editing_plan || {}, "editing_plan");
  return staged;
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
    editing_plan: {},
    captions_style:   "highlight",
    fps:              30,
    brand_color:      "#E0701E",
    instagram_handle: "@omerd",
  };
}

function createPlaceholderVideo() {
  const videosDir  = path.join(PUBLIC_DIR, "videos");
  fs.mkdirSync(videosDir, { recursive: true });
  const outputPath = path.join(videosDir, "placeholder_video.mp4");
  if (fs.existsSync(outputPath)) return;
  const compositorDirs = fs.readdirSync(path.join(__dirname, "node_modules", "@remotion"))
    .filter(d => d.startsWith("compositor-"));
  const ffmpegBin = compositorDirs
    .map(d => path.join(__dirname, "node_modules", "@remotion", d, "ffmpeg"))
    .find(p => fs.existsSync(p));
  if (!ffmpegBin) {
    console.error("[render_edit] Could not find Remotion ffmpeg binary");
    return;
  }
  const libDir = path.dirname(ffmpegBin);
  try {
    const pngPath = path.join(os.tmpdir(), "placeholder_frame.png");
    execSync(`python3 -c "from PIL import Image; Image.new('RGB', (1080, 1920), (20, 20, 20)).save('${pngPath}')"`, { stdio: "pipe" });
    const env = { ...process.env, DYLD_LIBRARY_PATH: libDir, LD_LIBRARY_PATH: libDir };
    execSync(`"${ffmpegBin}" -y -loop 1 -framerate 30 -i "${pngPath}" -t 6 -c:v libx264 -g 30 -bf 0 -pix_fmt yuv420p "${outputPath}"`, { stdio: "pipe", env });
  } catch (e) {
    console.error("[render_edit] Could not create placeholder video:", e.message);
  }
}

// ── Bundle cache ──────────────────────────────────────────────────────────────
// webpack compilation takes 15-30s; cache the result and reuse across renders.
// Key = every src file's path+size+mtime, so an edited, added, deleted OR
// reverted (older-mtime) file all produce a new bundle.

const BUNDLE_CACHE_FILE = path.join(__dirname, ".bundle-cache.json");

function srcSignature(dir) {
  const h = crypto.createHash("sha1");
  const walk = (d) => {
    for (const name of fs.readdirSync(d).sort()) {
      const full = path.join(d, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else h.update(`${path.relative(dir, full)}|${stat.size}|${Math.floor(stat.mtimeMs)}\n`);
    }
  };
  walk(dir);
  return h.digest("hex");
}

async function getBundle() {
  const srcDir = path.join(__dirname, "src");
  const signature = srcSignature(srcDir);
  if (fs.existsSync(BUNDLE_CACHE_FILE)) {
    try {
      const cache = JSON.parse(fs.readFileSync(BUNDLE_CACHE_FILE, "utf8"));
      if (cache.location && cache.signature === signature &&
          fs.existsSync(path.join(cache.location, "index.html"))) {
        console.error("[render_edit] ✓ Using cached bundle (webpack skipped)");
        return cache.location;
      }
    } catch { /* cache invalid */ }
  }
  console.error("[render_edit] Building bundle (first time or source changed)...");
  const location = await bundle({
    entryPoint:      path.join(srcDir, "index.ts"),
    publicDir:       PUBLIC_DIR,
    webpackOverride: (config) => config,
  });
  try {
    fs.writeFileSync(BUNDLE_CACHE_FILE, JSON.stringify({ location, signature }));
  } catch { /* non-fatal (read-only plugin dir) */ }
  return location;
}

/** Mirror a public/ subfolder into the bundle, replacing changed files. */
function syncPublicDir(bundleLocation, folder) {
  const srcDir = path.join(PUBLIC_DIR, folder);
  if (!fs.existsSync(srcDir)) return;
  const walk = (rel) => {
    const from = path.join(srcDir, rel);
    for (const name of fs.readdirSync(from)) {
      const r = path.join(rel, name);
      const s = path.join(srcDir, r);
      const d = path.join(bundleLocation, "public", folder, r);
      const st = fs.statSync(s);
      if (st.isDirectory()) { walk(r); continue; }
      if (!fs.existsSync(d) || fs.statSync(d).size !== st.size || fs.statSync(d).mtimeMs < st.mtimeMs) {
        fs.mkdirSync(path.dirname(d), { recursive: true });
        fs.copyFileSync(s, d);
      }
    }
  };
  walk("");
}

function probeFrames(file) {
  const compositor = fs.readdirSync(path.join(__dirname, "node_modules", "@remotion"))
    .filter((d) => d.startsWith("compositor-"))
    .map((d) => path.join(__dirname, "node_modules", "@remotion", d, "ffprobe"))
    .find((p) => fs.existsSync(p));
  const candidates = ["ffprobe", path.join(os.homedir(), ".local/bin/ffprobe"), compositor].filter(Boolean);
  for (const bin of candidates) {
    try {
      const env = compositor && bin === compositor
        ? { ...process.env, DYLD_LIBRARY_PATH: path.dirname(bin), LD_LIBRARY_PATH: path.dirname(bin) }
        : process.env;
      const out = execFileSync(bin, ["-v", "error", "-count_packets", "-select_streams", "v:0",
        "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", file], { env, stdio: ["ignore", "pipe", "ignore"] });
      const n = parseInt(String(out).trim(), 10);
      if (Number.isFinite(n)) return n;
    } catch { /* try next */ }
  }
  return null;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { propsFile, outputPath, test } = parseArgs();
  let props;
  let output;
  let propsDir = process.cwd();

  if (test) {
    output = path.resolve(outputPath || path.join(__dirname, "..", "output", "test_edited.mp4"));
    createPlaceholderVideo();
    props = getTestProps();
    console.error("[render_edit] Running in test mode...");
  } else {
    if (!propsFile || !outputPath) {
      console.error("Usage: node render_edit.mjs --props <json> --output <mp4>");
      process.exit(1);
    }
    const propsAbs = path.resolve(propsFile);
    output = path.resolve(outputPath);
    propsDir = path.dirname(propsAbs);
    props = JSON.parse(fs.readFileSync(propsAbs, "utf-8"));
  }

  const fps         = props.fps || 30;
  const totalFrames = Number.isInteger(props.duration_frames) && props.duration_frames > 0
    ? props.duration_frames
    : Math.max(1, Math.round((props.duration_seconds || 10) * fps));
  props.duration_frames = totalFrames;

  console.error(`[render_edit] Duration: ${totalFrames} frames (${(totalFrames / fps).toFixed(3)}s)`);
  console.error(`[render_edit] Output:   ${output}`);
  fs.mkdirSync(path.dirname(output), { recursive: true });

  const bundleLocation = await getBundle();

  // Remotion serves the bundle's own copy of public/, baked at webpack time,
  // so assets must be put INTO the bundle before rendering.
  syncPublicDir(bundleLocation, "music");
  syncPublicDir(bundleLocation, "icons");
  syncPublicDir(bundleLocation, "sfx");

  let staged = [];
  if (!test) {
    staged = stageAssets(props, propsDir, bundleLocation);
    for (const s of staged) console.error(`[render_edit] Staged ${s.field}: ${s.from} → ${s.to}`);
  }

  const chromeFlags = {
    gl: process.env.REMOTION_GL || "swiftshader",
    enableMultiProcessOnLinux: true,
  };
  const composition = await selectComposition({
    serveUrl:   bundleLocation,
    id:         "EditedReel",
    inputProps: props,
    chromiumOptions: chromeFlags,
    timeoutInMilliseconds: 120000,
  });
  if (composition.durationInFrames !== totalFrames) {
    throw new Error(`composition has ${composition.durationInFrames} frames, expected ${totalFrames}`);
  }

  console.error("[render_edit] Rendering...");
  await renderMedia({
    composition,
    serveUrl:       bundleLocation,
    codec:          "h264",
    outputLocation: output,
    inputProps:     props,
    imageFormat:    "jpeg",
    // bt709 tags + limited range, i.e. what phones shoot and Instagram expects
    // (without it exports came out full-range with PAL primaries → shifted colours).
    colorSpace:     "bt709",
    // jpeg 100 capture + crf 18: the export must not look softer than the source.
    jpegQuality:    process.env.RENDER_JPEG_QUALITY ? parseInt(process.env.RENDER_JPEG_QUALITY) : 100,
    crf:            process.env.RENDER_CRF ? parseInt(process.env.RENDER_CRF) : 18,
    x264Preset:     process.env.RENDER_X264_PRESET || "medium",
    // 2 workers: more concurrent OffthreadVideo decodes starved the CPU and
    // frames timed out into repeats (visible stutter).
    concurrency:    process.env.RENDER_CONCURRENCY ? parseInt(process.env.RENDER_CONCURRENCY) : 2,
    timeoutInMilliseconds: 90000,
    chromiumOptions: chromeFlags,
    onProgress: ({ progress }) => {
      const pct    = Math.round(progress * 100);
      const filled = Math.floor(pct / 10);
      console.error(`[render_edit] Progress: ${"▓".repeat(filled)}${"░".repeat(10 - filled)} ${pct}%`);
    },
  });

  const measured = probeFrames(output);
  if (measured !== null && measured !== totalFrames) {
    throw new Error(`output has ${measured} frames, expected ${totalFrames}`);
  }
  console.log(JSON.stringify({
    success: true, output, frames: measured ?? totalFrames,
    duration_seconds: totalFrames / fps, staged,
  }));
}

main().catch((err) => {
  console.log(JSON.stringify({ success: false, error: err.message || String(err) }));
  process.exit(1);
});
