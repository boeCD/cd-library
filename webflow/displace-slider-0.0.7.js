/*!
 * WebflowDisplaceSlider v0.6.2
 * Image + Video displacement slider with true object-fit: cover behavior
 * Requires THREE.js r134
 */

(function (global) {
  'use strict';

  if (!global.THREE) {
    console.warn('[WebflowDisplaceSlider] THREE is not available.');
    return;
  }

  /* ------------------------------------------------------------------ */
  /* CONFIG                                                             */
  /* ------------------------------------------------------------------ */

  var DEFAULT_KEY = 'default';

  var DISP_MAPS = {
    'default': 'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/webflow/disp-map/heightMap.png',
    'dot':     'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/webflow/disp-map/dot.jpg',
    'fluid':   'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/webflow/disp-map/fluid.jpg',
    'height':  'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/webflow/disp-map/heightMap.png',
    'ramen':   'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/webflow/disp-map/ramen.jpg',
    'strip':   'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/webflow/disp-map/strip.png',
    'diamond': 'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/webflow/disp-map/diamond.png',
    'stripe1': 'https://cdn.jsdelivr.net/gh/boeCD/cd-library@main/webflow/disp-map/stripe1.png'
  };

  var POLL_INTERVAL = 200;
  var TRANSITION_DURATION = 1.4;
  var DISPLACE_INTENSITY = 0.3;

  var ATTR_ENABLE = 'data-displace-slider';
  var ATTR_DEFAULT = 'data-disp-default';
  var ATTR_IMAGE_MAP = 'data-disp-map';
  var ATTR_SOURCE = 'data-displace-source';

  /* ------------------------------------------------------------------ */
  /* UTILS                                                              */
  /* ------------------------------------------------------------------ */

  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function getActiveSlide(slides) {
    var idx = 0;
    slides.forEach(function (slide, i) {
      var hidden = slide.getAttribute('aria-hidden');
      var st = getComputedStyle(slide);
      if (hidden !== 'true' && st.display !== 'none' && st.visibility !== 'hidden') {
        idx = i;
      }
    });
    return idx;
  }

  /* ------------------------------------------------------------------ */
  /* SOURCE DETECTION                                                   */
  /* ------------------------------------------------------------------ */

  function getSource(slide) {
    var wrapper = slide.querySelector('[' + ATTR_SOURCE + ']');
    if (!wrapper) {
      var img = slide.querySelector('img');
      if (img) return { type: 'image', el: img };
      return null;
    }

    if (wrapper.tagName === 'IMG') {
      return { type: 'image', el: wrapper };
    }

    var video = wrapper.querySelector('video');
    if (video) return { type: 'video', el: video };

    var img2 = wrapper.querySelector('img');
    if (img2) return { type: 'image', el: img2 };

    return null;
  }

  function createVideoTexture(video) {
    var tex = new THREE.VideoTexture(video);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.format = THREE.RGBAFormat;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  /* ------------------------------------------------------------------ */
  /* SLIDER INSTANCE                                                    */
  /* ------------------------------------------------------------------ */

  function Slider(sliderEl) {
    this.el = sliderEl;
    this.mask = sliderEl.querySelector('.w-slider-mask');
    this.slides = Array.from(sliderEl.querySelectorAll('.w-slide'));
    this.defaultKey = sliderEl.getAttribute(ATTR_DEFAULT) || DEFAULT_KEY;

    this.sources = [];
    this.maps = [];

    this.active = 0;
    this.last = 0;
    this.busy = false;

    this.texCache = {};
    this.dispCache = {};

    this.containerW = 1;
    this.containerH = 1;

    this.init();
  }

  Slider.prototype.init = function () {
    var self = this;

    this.slides.forEach(function (slide) {
      var src = getSource(slide);
      self.sources.push(src);
      self.maps.push(src && src.el.getAttribute
        ? src.el.getAttribute(ATTR_IMAGE_MAP)
        : null);
    });

    this.active = getActiveSlide(this.slides);
    this.last = this.active;

    this.buildScene();
    this.hideDOM();
    this.poll();
  };

  Slider.prototype.hideDOM = function () {
    this.slides.forEach(function (s) {
      s.querySelectorAll('img,video').forEach(function (el) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      });
    });
  };

  /* ------------------------------------------------------------------ */
  /* THREE SETUP                                                        */
  /* ------------------------------------------------------------------ */

  Slider.prototype.buildScene = function () {
    var self = this;
    this.containerW = this.mask.clientWidth || 1;
    this.containerH = this.mask.clientHeight || 1;

    this.mask.style.position = 'relative';

    this.overlay = document.createElement('div');
    this.overlay.style.position = 'absolute';
    this.overlay.style.inset = '0';
    this.overlay.style.pointerEvents = 'none';
    this.mask.appendChild(this.overlay);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(this.containerW, this.containerH);
    this.overlay.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    var geometry = new THREE.PlaneBufferGeometry(2, 2);

    this.uniforms = {
      uTexture1: { value: null },
      uTexture2: { value: null },
      uDisp:     { value: null },
      uProgress: { value: 1 },
      uIntensity:{ value: DISPLACE_INTENSITY },
      uScale1:   { value: new THREE.Vector2(1,1) },
      uScale2:   { value: new THREE.Vector2(1,1) }
    };

    var material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture1, uTexture2, uDisp;
        uniform float uProgress, uIntensity;
        uniform vec2 uScale1, uScale2;
        varying vec2 vUv;

        void main() {
          vec2 c = vec2(0.5);
          vec2 uv1 = (vUv - c) * uScale1 + c;
          vec2 uv2 = (vUv - c) * uScale2 + c;

          vec2 disp = (texture2D(uDisp, vUv).rg * 2.0 - 1.0)
                      * uIntensity * (1.0 - uProgress);

          vec4 a = texture2D(uTexture1, uv1);
          vec4 b = texture2D(uTexture2, uv2 + disp);

          gl_FragColor = mix(a, b, uProgress);
        }
      `
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    this.setStatic(this.active);
    window.addEventListener('resize', function () {
      self.onResize();
    });
  };

  Slider.prototype.onResize = function () {
    this.containerW = this.mask.clientWidth || 1;
    this.containerH = this.mask.clientHeight || 1;
    this.renderer.setSize(this.containerW, this.containerH);
    this.render();
  };

  /* ------------------------------------------------------------------ */
  /* TEXTURE / SCALE HELPERS                                            */
  /* ------------------------------------------------------------------ */

  Slider.prototype.computeCoverScale = function (w, h) {
    var arImg = w / h;
    var arBox = this.containerW / this.containerH;
    return arBox > arImg
      ? { x: 1, y: arImg / arBox }
      : { x: arBox / arImg, y: 1 };
  };

  Slider.prototype.applyScale = function (tex, uniform) {
    var self = this;

    if (tex.image && tex.image.width) {
      var s = this.computeCoverScale(tex.image.width, tex.image.height);
      uniform.set(s.x, s.y);
      return;
    }

    // VIDEO: wait for metadata
    if (tex.image && tex.image.videoWidth) {
      var s2 = this.computeCoverScale(tex.image.videoWidth, tex.image.videoHeight);
      uniform.set(s2.x, s2.y);
      return;
    }

    // fallback: wait for metadata
    if (tex.image && tex.image.addEventListener) {
      tex.image.addEventListener('loadedmetadata', function () {
        var s3 = self.computeCoverScale(
          tex.image.videoWidth,
          tex.image.videoHeight
        );
        uniform.set(s3.x, s3.y);
        self.render();
      }, { once: true });
    }
  };

  /* ------------------------------------------------------------------ */
  /* LOADERS                                                            */
  /* ------------------------------------------------------------------ */

  Slider.prototype.loadTexture = function (src, cb) {
    var self = this;
    if (!src) return cb(null);

    if (src.type === 'video') {
      cb(createVideoTexture(src.el));
      return;
    }

    if (this.texCache[src.el.src]) {
      cb(this.texCache[src.el.src]);
      return;
    }

    new THREE.TextureLoader().load(src.el.src, function (t) {
      self.texCache[src.el.src] = t;
      cb(t);
    });
  };

  Slider.prototype.loadDisp = function (key, cb) {
    var k = key || DEFAULT_KEY;
    if (this.dispCache[k]) return cb(this.dispCache[k]);

    new THREE.TextureLoader().load(DISP_MAPS[k], function (t) {
      t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
      cb(t);
    });
  };

  /* ------------------------------------------------------------------ */
  /* RENDER / TRANSITION                                                */
  /* ------------------------------------------------------------------ */

  Slider.prototype.render = function () {
    this.renderer.render(this.scene, this.camera);
  };

  Slider.prototype.setStatic = function (idx) {
    var self = this;
    var src = this.sources[idx];

    this.loadTexture(src, function (tex) {
      if (!tex) return;
      self.uniforms.uTexture1.value = tex;
      self.uniforms.uTexture2.value = tex;
      self.uniforms.uProgress.value = 1;

      self.applyScale(tex, self.uniforms.uScale1.value);
      self.applyScale(tex, self.uniforms.uScale2.value);

      self.loadDisp(self.defaultKey, function (d) {
        self.uniforms.uDisp.value = d;
        self.render();
      });
    });
  };

  Slider.prototype.transition = function (from, to) {
    var self = this;
    if (this.busy) return;
    this.busy = true;

    var mapKey = this.maps[to] || this.maps[from] || this.defaultKey;

    this.loadTexture(this.sources[from], function (t1) {
      self.loadTexture(self.sources[to], function (t2) {
        self.loadDisp(mapKey, function (disp) {
          self.uniforms.uTexture1.value = t1;
          self.uniforms.uTexture2.value = t2;
          self.uniforms.uDisp.value = disp;
          self.uniforms.uProgress.value = 0;

          self.applyScale(t1, self.uniforms.uScale1.value);
          self.applyScale(t2, self.uniforms.uScale2.value);

          var start = performance.now();
          (function loop(now) {
            var t = Math.min(1, (now - start) / (TRANSITION_DURATION * 1000));
            self.uniforms.uProgress.value = easeInOutCubic(t);
            self.render();
            if (t < 1) requestAnimationFrame(loop);
            else {
              self.busy = false;
              self.last = to;
            }
          })(start);
        });
      });
    });
  };

  Slider.prototype.poll = function () {
    var self = this;
    setInterval(function () {
      var idx = getActiveSlide(self.slides);
      if (idx !== self.last && !self.busy) {
        self.transition(self.last, idx);
      }
    }, POLL_INTERVAL);
  };

  /* ------------------------------------------------------------------ */
  /* INIT                                                               */
  /* ------------------------------------------------------------------ */

  function init() {
    document
      .querySelectorAll('.w-slider[' + ATTR_ENABLE + '="true"]')
      .forEach(function (el) {
        new Slider(el);
      });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);

})(window);
