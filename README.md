<div align="center">
  <img src="public/frameflip-logo.png" width="112" alt="FrameFlip logo" />
  <h1>FrameFlip</h1>
  <p><strong>Your video, your view.</strong></p>
  <p>A lightweight browser toolbox for flipping, rotating, adjusting, and downloading videos on the page you’re watching.</p>
</div>

---

## ✨ What you can do

- **Flip** a video horizontally or vertically.
- **Rotate** in 90° steps.
- **Adjust the look** with grayscale, sepia, brightness, and contrast filters.
- **Control playback** with play/pause and fullscreen actions.
- **Download direct video files** when the page exposes a usable media URL.
- **Keep your setup** with saved adjustments for each page and video.
- **Choose a theme**: Light, Dark, or System.

## 🚀 Install in Brave

FrameFlip is currently distributed as an unpacked browser extension.

1. Download and extract the FrameFlip ZIP.
2. Open `brave://extensions`.
3. Turn on **Developer mode**.
4. Select **Load unpacked**.
5. Choose the extracted folder containing `manifest.json`.
6. Pin FrameFlip from the Extensions menu for quick access.

To build your own ZIP from this project:

```bash
pnpm install
pnpm zip
```

WXT writes the packaged extension to `.output/`. Extract that ZIP before loading it in Brave.

## 🎬 Use FrameFlip

1. Open a page with a video and start playback if needed.
2. Select the **FrameFlip** icon in the browser toolbar.
3. If the page has multiple videos, choose one from **Active video**.
4. Apply transforms or image filters. Your choices are saved for that page and video.
5. Choose **Reset adjustments** to restore the original view.

Use the theme menu in the popup to switch between **Light**, **Dark**, and **System**.

## ⬇️ About downloads

FrameFlip can download a video when the browser can access a direct file URL, such as an MP4. Many streaming services use segmented, temporary, or protected streams instead. Those streams may not have a single file URL, so FrameFlip may be unable to download them; use the platform’s own download feature when available.

## 🧰 Development

Requirements: Node.js and pnpm.

```bash
pnpm install        # Install dependencies
pnpm dev            # Run the WXT development server
pnpm compile        # Check TypeScript types
pnpm build           # Build for Chromium browsers
pnpm build:firefox   # Build for Firefox
pnpm zip             # Package for Chromium browsers
pnpm zip:firefox     # Package for Firefox
```

Load the generated extension directory from `.output/` as an unpacked extension while developing. After rebuilding, reload FrameFlip from the browser’s extensions page.

## 🔐 Permissions

- `activeTab` and `scripting` let FrameFlip inspect and control video elements in the active tab after you open the popup.
- `downloads` starts a browser download for a direct video URL.
- `storage` saves theme and per-page video adjustments.

## 🧱 Built with

[WXT](https://wxt.dev/) · [React](https://react.dev/) · [Lucide](https://lucide.dev/) · [Inter](https://rsms.me/inter/)

---

<div align="center"><sub>Made for the moment. Built with FrameFlip.</sub></div>
