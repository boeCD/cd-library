/*!
 * ImageSequenceScrub v1.0.0
 * (c) 2024 Creative Directors / OpenAI
 * MIT License
 * https://github.com/yourusername/yourrepo
 *
 * Usage:
 * 1. Add [data-image-sequence] to a parent div.
 * 2. Set all options as data attributes (see below).
 * 3. Add [data-sequence-img], [data-sequence-scrub], [data-sequence-track] inside the div.
 * 4. Control .scrub-container width (e.g. via CSS, JS, or interactions).
 * 5. Script auto-initializes all sequences on page load.
 *
 * Data Attributes:
 *   data-folder       (required) Folder URL (trailing slash)
 *   data-prefix       (optional) Filename prefix (default: "")
 *   data-ext          (optional) File extension (default: ".jpg")
 *   data-start        (required) First frame number (int)
 *   data-end          (required) Last frame number (int)
 *   data-pad          (optional) Number padding digits (default: 3)
 *   data-preload      (optional) If present, preload all images
 */

class ImageSequenceScrub {
  constructor(el) {
    this.el = el;
    this.folder = el.getAttribute("data-folder");
    this.prefix = el.getAttribute("data-prefix") || "";
    this.ext = el.getAttribute("data-ext") || ".jpg";
    this.start = parseInt(el.getAttribute("data-start"), 10) || 1;
    this.end = parseInt(el.getAttribute("data-end"), 10) || 1;
    this.pad = parseInt(el.getAttribute("data-pad"), 10) || 3;
    this.preload = el.hasAttribute("data-preload");
    this.target = el.querySelector("[data-sequence-img]");
    this.scrubContainer = el.querySelector("[data-sequence-scrub]");
    this.outerTrack = el.querySelector("[data-sequence-track]");
    if (!this.folder || !this.target || !this.scrubContainer || !this.outerTrack) {
      // Essential config missing—do nothing.
      return;
    }
    this.images = this.createImageSequenceArray();
    this.frame = { i: 0 };
    this.init();
  }

  padNum(num) {
    return num.toString().padStart(this.pad, "0");
  }

  createImageSequenceArray() {
    const arr = [];
    for (let i = this.start; i <= this.end; i++) {
      arr.push(`${this.folder}${this.prefix}${this.padNum(i)}${this.ext}`);
    }
    return arr;
  }

  preloadImages() {
    this.images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }

  getPercentWidth() {
    const w = this.scrubContainer.offsetWidth;
    const total = this.outerTrack.offsetWidth;
    return total ? (w / total) : 0;
  }

  render() {
    const idx = Math.round(this.frame.i);
    if (this.target.tagName && this.target.tagName.toLowerCase() === "img") {
      this.target.src = this.images[idx];
    } else {
      this.target.style.backgroundImage = `url('${this.images[idx]}')`;
    }
  }

  updateFrameFromWidth() {
    const percent = this.getPercentWidth(); // 0..1
    const frameIndex = percent * (this.images.length - 1);
    if (window.gsap) {
      gsap.to(this.frame, {
        i: frameIndex,
        duration: 0.3,
        onUpdate: () => this.render(),
        overwrite: true,
        ease: "power1.out"
      });
    } else {
      this.frame.i = frameIndex;
      this.render();
    }
  }

  init() {
    if (this.preload) this.preloadImages();
    this.render();
    this.updateFrameFromWidth();
    this.observer = new ResizeObserver(() => this.updateFrameFromWidth());
    this.observer.observe(this.scrubContainer);
  }

  // Static: Auto-initialize on all [data-image-sequence]
  static initAll() {
    document.querySelectorAll("[data-image-sequence]").forEach(el => {
      if (!el._imageSequenceScrub) {
        el._imageSequenceScrub = new ImageSequenceScrub(el);
      }
    });
  }
}

if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => ImageSequenceScrub.initAll());
}
