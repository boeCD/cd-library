/*!
 * WebflowDisplaceSlider v0.2
 * Displacement-based slide transitions for selected Webflow sliders.
 * Requires THREE (three.js r120+ recommended).
 *
 * Usage:
 *   1) Add three.js before this script:
 *      <script src="/assets/js/three.r134.min.js"></script>
 *      <script src="/assets/js/webflow-displace-slider.js"></script>
 *
 *   2) On any Webflow slider you want to affect, set:
 *      data-displace-slider="true"
 *      data-disp-default="cool-1"    (optional, slider-level default map)
 *
 *   3) On slide images (optional per-image override):
 *      <img src="..." data-disp-map="liquid-2">
 *
 *   Displacement map priority for a transition old -> new:
 *     1. new slide's data-disp-map
 *     2. old slide's data-disp-map
 *     3. slider's data-disp-default
 *     4. script DEFAULT_KEY fallback
 */

(function (global) {
  'use strict';

  if (!global.THREE) {
    console.warn('[WebflowDisplaceSlider] THREE is not available.');
  }

  // ---------------------------------------------------------------------------
  // CONFIG
  // ---------------------------------------------------------------------------

  // Key used if nothing is defined on slider or images.
  var DEFAULT_KEY = 'default';

  // Displacement map registry: fill URLs later.
  // Example:
  //   'cool-1':   'https://raw.githubusercontent.com/.../cool-1.png',
  //   'liquid-2': 'https://raw.githubusercontent.com/.../liquid-2.png',
  var DISP_MAPS = {
    // Fallback used when nothing else is defined
    'default': 'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/webflow/disp-map/heightMap.png',

    // Clean dot-pattern displacement
    'dot': 'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/webflow/disp-map/dot.jpg',

    // Fluid / liquid-style distortions
    'fluid': 'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/webflow/disp-map/fluid.jpg',

    // Height-based displacement (good all-rounder)
    'height': 'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/webflow/disp-map/heightMap.png',

    // Organic ramen-like wave texture
    'ramen': 'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/webflow/disp-map/ramen.jpg',

    // Stripes vertical
    'strip': 'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/webflow/disp-map/strip.png',

    // Stripes variation
    'stripe1': 'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/webflow/disp-map/stripe1.png'
  };


  // Polling interval: we just check which slide Webflow marks as active.
  var POLL_INTERVAL = 200; // ms

  // Transition duration in seconds.
  var TRANSITION_DURATION = 1.2;

  // Displacement intensity.
  var DISPLACE_INTENSITY = 0.3;

  // Attribute names
  var ATTR_SLIDER_ENABLE   = 'data-displace-slider';
  var ATTR_SLIDER_DEFAULT  = 'data-disp-default';
  var ATTR_IMAGE_MAP       = 'data-disp-map';

  // ---------------------------------------------------------------------------
  // Slider instance
  // ---------------------------------------------------------------------------

  function DisplaceSliderInstance(sliderEl) {
    this.sliderEl = sliderEl;
    this.mask = sliderEl.querySelector('.w-slider-mask');
    this.slides = Array.prototype.slice.call(sliderEl.querySelectorAll('.w-slide'));

    this.slideImages = [];    // array of image URLs per slide
    this.slideDispKeys = [];  // array of disp keys per slide (from data-disp-map)
    this.sliderDefaultKey = sliderEl.getAttribute(ATTR_SLIDER_DEFAULT) || DEFAULT_KEY;

    this.activeIndex = 0;
    this.lastIndex = 0;
    this.isTransitioning = false;

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.material = null;
    this.mesh = null;

    this.texCache = {}; // url -> THREE.Texture
    this.dispTexCache = {}; // key -> THREE.Texture

    this.overlay = null;
    this.pollTimer = null;

    this._init();
  }

  DisplaceSliderInstance.prototype._init = function () {
    if (!this.mask || !this.slides.length) return;
    if (!global.THREE) return;

    this._collectSlideImagesAndKeys();
    this._hideOriginalImages();
    this._createOverlay();
    this._createThreeScene();
    this._setupResize();
    this._startPolling();
  };

  DisplaceSliderInstance.prototype._collectSlideImagesAndKeys = function () {
    var self = this;
    this.slideImages = [];
    this.slideDispKeys = [];

    this.slides.forEach(function (slide) {
      var img = slide.querySelector('img.js-displace-img') || slide.querySelector('img');
      if (!img) {
        self.slideImages.push(null);
        self.slideDispKeys.push(null);
        return;
      }
      self.slideImages.push(img.getAttribute('src') || null);
      self.slideDispKeys.push(img.getAttribute(ATTR_IMAGE_MAP) || null);
    });

    this.activeIndex = this._getActiveSlideIndex();
    this.lastIndex = this.activeIndex;
  };

  DisplaceSliderInstance.prototype._hideOriginalImages = function () {
    this.slides.forEach(function (slide) {
      var imgs = slide.querySelectorAll('img');
      imgs.forEach(function (img) {
        img.style.opacity = '0';
        img.style.pointerEvents = 'none';
      });
    });
  };

  DisplaceSliderInstance.prototype._createOverlay = function () {
    var maskStyle = window.getComputedStyle(this.mask);
    if (maskStyle.position === 'static') {
      this.mask.style.position = 'relative';
    }

    var overlay = document.createElement('div');
    overlay.className = 'displace-slider-overlay';
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.zIndex = '2';
    overlay.style.pointerEvents = 'none';
    overlay.style.overflow = 'hidden';

    this.mask.appendChild(overlay);
    this.overlay = overlay;
  };

  DisplaceSliderInstance.prototype._createThreeScene = function () {
    var width = this.mask.clientWidth || 10;
    var height = this.mask.clientHeight || 10;

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(width, height);
    this.overlay.appendChild(renderer.domElement);
    this.renderer = renderer;

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = scene;
    this.camera = camera;

    var geometry = new THREE.PlaneBufferGeometry(2, 2);

    var uniforms = {
      uTexture1:  { value: null },
      uTexture2:  { value: null },
      uDisp:      { value: null },
      uProgress:  { value: 1.0 },
      uIntensity: { value: DISPLACE_INTENSITY }
    };

    var vertexShader = [
      'varying vec2 vUv;',
      'void main() {',
      '  vUv = uv;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}'
    ].join('\n');

    var fragmentShader = [
      'uniform sampler2D uTexture1;',
      'uniform sampler2D uTexture2;',
      'uniform sampler2D uDisp;',
      'uniform float uProgress;',
      'uniform float uIntensity;',
      'varying vec2 vUv;',

      'void main() {',
      '  vec4 disp = texture2D(uDisp, vUv);',
      '  vec2 dispVec = (disp.rg * 2.0 - 1.0) * uIntensity;',
      '  vec2 uv1 = vUv + dispVec * (1.0 - uProgress);',
      '  vec2 uv2 = vUv - dispVec * uProgress;',
      '  vec4 tex1 = texture2D(uTexture1, uv1);',
      '  vec4 tex2 = texture2D(uTexture2, uv2);',
      '  gl_FragColor = mix(tex1, tex2, uProgress);',
      '}'
    ].join('\n');

    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });

    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    this.material = material;
    this.mesh = mesh;

    // Initial: show current slide as static image
    var baseImg = this.slideImages[this.activeIndex] || this.slideImages[0];
    this._setStaticImage(baseImg);
  };

  // ---------------------------------------------------------------------------
  // Texture loading helpers
  // ---------------------------------------------------------------------------

  DisplaceSliderInstance.prototype._loadTexture = function (url, cb) {
    var self = this;
    if (!url) {
      cb(null);
      return;
    }
    if (this.texCache[url]) {
      cb(this.texCache[url]);
      return;
    }
    var loader = new THREE.TextureLoader();
    loader.load(
      url,
      function (tex) {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        self.texCache[url] = tex;
        cb(tex);
      },
      undefined,
      function () {
        console.warn('[WebflowDisplaceSlider] Failed to load texture:', url);
        cb(null);
      }
    );
  };

  DisplaceSliderInstance.prototype._loadDispTexture = function (key, cb) {
    var self = this;
    var finalKey = key || DEFAULT_KEY;
    var url = DISP_MAPS[finalKey] || DISP_MAPS[DEFAULT_KEY];

    if (!url) {
      console.warn('[WebflowDisplaceSlider] No displacement URL for key:', finalKey);
      cb(null);
      return;
    }

    if (this.dispTexCache[finalKey]) {
      cb(this.dispTexCache[finalKey]);
      return;
    }

    var loader = new THREE.TextureLoader();
    loader.load(
      url,
      function (tex) {
        tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping;
        self.dispTexCache[finalKey] = tex;
        cb(tex);
      },
      undefined,
      function () {
        console.warn('[WebflowDisplaceSlider] Failed to load displacement map:', url);
        cb(null);
      }
    );
  };

  DisplaceSliderInstance.prototype._setStaticImage = function (url) {
    var self = this;
    if (!url) return;

    this._loadTexture(url, function (tex) {
      if (!tex || !self.material) return;
      self.material.uniforms.uTexture1.value = tex;
      self.material.uniforms.uTexture2.value = tex;
      self.material.uniforms.uProgress.value = 1.0;

      // Ensure some displacement is bound (fallback/default) for consistency
      self._loadDispTexture(self.sliderDefaultKey, function (dtex) {
        if (dtex && self.material) {
          self.material.uniforms.uDisp.value = dtex;
        }
        self._render();
      });
    });
  };

  // ---------------------------------------------------------------------------
  // Core animation
  // ---------------------------------------------------------------------------

  DisplaceSliderInstance.prototype._render = function () {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
  };

  DisplaceSliderInstance.prototype._animate = function (from, to, duration, onUpdate, onComplete) {
    var start = performance.now();
    var self = this;

    function loop(now) {
      var t = Math.min(1, (now - start) / (duration * 1000));
      var eased = t * (2 - t); // easeOutQuad
      var value = from + (to - from) * eased;
      onUpdate(value);
      self._render();
      if (t < 1) {
        requestAnimationFrame(loop);
      } else if (onComplete) {
        onComplete();
      }
    }

    requestAnimationFrame(loop);
  };

  // Decide which displacement key to use for this transition
  DisplaceSliderInstance.prototype._getDispKeyForTransition = function (oldIndex, newIndex) {
    var newKey = this.slideDispKeys[newIndex] || null;
    var oldKey = this.slideDispKeys[oldIndex] || null;

    if (newKey) return newKey;
    if (oldKey) return oldKey;
    if (this.sliderDefaultKey) return this.sliderDefaultKey;
    return DEFAULT_KEY;
  };

  DisplaceSliderInstance.prototype._transitionTo = function (oldIndex, newIndex) {
    var self = this;
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    var oldUrl = this.slideImages[oldIndex] || this.slideImages[0];
    var newUrl = this.slideImages[newIndex] || oldUrl;
    var dispKey = this._getDispKeyForTransition(oldIndex, newIndex);

    this._loadTexture(oldUrl, function (tex1) {
      self._loadTexture(newUrl, function (tex2) {
        self._loadDispTexture(dispKey, function (dtex) {
          if (!tex1 || !tex2 || !dtex || !self.material) {
            self.isTransitioning = false;
            return;
          }
          self.material.uniforms.uTexture1.value = tex1;
          self.material.uniforms.uTexture2.value = tex2;
          self.material.uniforms.uDisp.value     = dtex;
          self.material.uniforms.uProgress.value = 0.0;

          self._animate(
            0.0,
            1.0,
            TRANSITION_DURATION,
            function (v) {
              self.material.uniforms.uProgress.value = v;
            },
            function () {
              self.isTransitioning = false;
            }
          );
        });
      });
    });
  };

  // ---------------------------------------------------------------------------
  // Webflow integration: detect active slide via aria/visibility
  // ---------------------------------------------------------------------------

  DisplaceSliderInstance.prototype._getActiveSlideIndex = function () {
    var slides = this.slides;
    if (!slides.length) return 0;

    var activeIndex = 0;
    slides.forEach(function (slide, i) {
      var ariaHidden = slide.getAttribute('aria-hidden');
      var style = window.getComputedStyle(slide);
      if (
        ariaHidden !== 'true' &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      ) {
        activeIndex = i;
      }
    });
    return activeIndex;
  };

  DisplaceSliderInstance.prototype._startPolling = function () {
    var self = this;
    this.pollTimer = setInterval(function () {
      var idx = self._getActiveSlideIndex();
      if (idx !== self.lastIndex && !self.isTransitioning) {
        var oldIndex = self.lastIndex;
        self.lastIndex = idx;
        self._transitionTo(oldIndex, idx);
      }
    }, POLL_INTERVAL);
  };

  // ---------------------------------------------------------------------------
  // Resize handling
  // ---------------------------------------------------------------------------

  DisplaceSliderInstance.prototype._setupResize = function () {
    var self = this;
    function resize() {
      if (!self.renderer) return;
      var width = self.mask.clientWidth || 10;
      var height = self.mask.clientHeight || 10;
      self.renderer.setSize(width, height);
      self._render();
    }
    window.addEventListener('resize', resize);
    resize();
  };

  // ---------------------------------------------------------------------------
  // Global init
  // ---------------------------------------------------------------------------

  function initAll() {
    if (!global.THREE) {
      console.warn('[WebflowDisplaceSlider] THREE is required.');
      return;
    }

    var sliders = document.querySelectorAll('.w-slider[' + ATTR_SLIDER_ENABLE + '="true"]');
    if (!sliders.length) return;

    sliders.forEach(function (sliderEl) {
      new DisplaceSliderInstance(sliderEl);
    });
  }

  // Expose for manual re-init if needed (e.g. AJAX-added sliders)
  global.WebflowDisplaceSlider = {
    initAll: initAll,
    _DISP_MAPS: DISP_MAPS // for editing/inspection in console if needed
  };

  // Auto-init on DOM ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initAll, 0);
  } else {
    document.addEventListener('DOMContentLoaded', initAll);
  }
})(window);
