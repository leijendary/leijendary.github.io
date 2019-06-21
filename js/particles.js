(function () {
    'use strict';

    /**
     * Particles
     */
    var ImageParticles = function (element, image, options) {
        options = options === undefined ? {} : options;

        this.element = typeof element === 'object' ? element : document.querySelector(element);
        this.options = {
            particlesRandom: options.particlesRandom || 2,
            particlesDepth: options.particlesDepth || 3,
            particlesSize: options.particlesSize || 1,
            touchRadius: options.touchRadius || 5,
            imageX: options.imageX || 0.088,
            imageY: options.imageY || 0,
            id: options.id || 'particles'
        }
        this.image = image;
    }

    /**
     * Initialize particles
     */
    ImageParticles.prototype.init = function () {
        // Scene
        this.scene = new THREE.Scene();
        // Camera
        this.camera = new THREE.PerspectiveCamera(50, this.element.clientWidth / this.element.clientHeight, 1, 10000);
        this.camera.position.z = 300;
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        // Set the id of the renderer
        this.renderer.domElement.id = this.options.id;
        // Clock
        this.clock = new THREE.Clock(true);
        // Texture
        this.particles = new Particles(this);
        // Initialize interactive controls
        this.interactive = new InteractiveControls(this.camera, this.renderer.domElement, this.passiveEvent);
        // Add the particles into the scene
        this.scene.add(this.particles.container);
        // Append the rendered domElement into the html element
        this.element.appendChild(this.renderer.domElement);

        // Add listeners
        this.addListeners();

        this.animate();
        this.resize();
    }

    /**
     * Add event listeners
     */
    ImageParticles.prototype.addListeners = function () {
        this.animationHandler = this.animate.bind(this);

        window.addEventListener('resize', this.resize.bind(this));
    }

    /**
     * Animate the image canvas
     */
    ImageParticles.prototype.animate = function () {
        this.update();
        this.draw();

        requestAnimationFrame(this.animationHandler);
    }

    /**
     * Resize WebGL
     */
    ImageParticles.prototype.resize = function () {
        if (!this.renderer) {
            return;
        }

        this.camera.aspect = this.element.clientWidth / this.element.clientHeight;
        this.camera.updateProjectionMatrix();

        this.fovHeight = 2 * Math.tan((this.camera.fov * Math.PI) / 180 / 2) * this.camera.position.z;

        this.scene.position.x = this.element.clientWidth * this.options.imageX;
        this.scene.position.y = this.options.imageY;

        this.renderer.setSize(this.element.clientWidth, this.element.clientHeight);

        if (this.interactive) {
            this.interactive.resize();
        }

        if (this.particles) {
            this.particles.resize();
        }
    }

    /**
     * Update WebGL
     */
    ImageParticles.prototype.update = function () {
        var delta = this.clock.getDelta();

        if (this.particles) {
            this.particles.update(delta);
        }
    }

    /**
     * Draw the particles in the WebGL
     */
    ImageParticles.prototype.draw = function () {
        this.renderer.render(this.scene, this.camera);
    }

    ImageParticles.prototype.passiveEvent = function () {
        this.passive = this.passive || {
            tested: false,
            supported: false
        };

        function isSupported(cls) {
            if (cls.passive.tested) {
                return cls.passive.supported;
            }

            cls.passive.tested = true;

            try {
                var opts = Object.defineProperty({}, 'passive', {
                    get: function get() {
                        cls.passive.supported = true;
                    }
                });

                window.addEventListener('test', null, opts);
            } catch (e) {
                return cls.passive.supported;
            }

            window.removeEventListener('test', null, opts);

            return cls.passive.supported;
        }

        return isSupported(this) ? { passive: true } : false;
    }


    /**
     * Particles
     */
    var Particles = function (webgl) {
        this.webgl = webgl;
        // Object3D Container
        this.container = new THREE.Object3D();

        // Texture Loader
        var loader = new THREE.TextureLoader();
        loader.load(webgl.image, function (texture) {
            this.texture = texture;
            this.texture.minFilter = THREE.LinearFilter;
            this.texture.magFilter = THREE.LinearFilter;
            this.texture.format = THREE.RGBFormat;
            this.width = texture.image.width;
            this.height = texture.image.height;

            this.loadVertexShader();
            this.loadFragmentShader();

            this.initPoints();
            this.initHitArea();
            this.initTouch();
            this.resize();
            this.show();
        }.bind(this));
    }

    /**
     * Load the vertex shader file
     */
    Particles.prototype.loadVertexShader = function () {
        loadShader('particle.vert', function (text) {
            this.vertexShader = text;
        }.bind(this));
    }

    /**
     * Load the fragment shader file
     */
    Particles.prototype.loadFragmentShader = function () {
        loadShader('particle.frag', function (text) {
            this.fragmentShader = text;
        }.bind(this));
    }

    /**
     * Initialize particle points
     */
    Particles.prototype.initPoints = function () {
        this.numPoints = this.width * this.height;

        var numVisible = 0;
        var threshold = 34;
        var originalColors;
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        canvas.width = this.width;
        canvas.height = this.height;
        ctx.scale(1, -1);
        ctx.drawImage(this.texture.image, 0, 0, this.width, this.height * -1);

        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        originalColors = Float32Array.from(imgData.data);

        for (let i = 0; i < this.numPoints; i++) {
            if (originalColors[i * 4 + 0] > threshold) {
                numVisible++;
            }
        }

        var uniforms = {
            uTime: { value: 2 },
            uRandom: { value: this.webgl.options.particlesRandom },
            uDepth: { value: this.webgl.options.particlesDepth },
            uSize: { value: this.webgl.options.particlesSize },
            uTextureSize: { value: new THREE.Vector2(this.width, this.height) },
            uTexture: { value: this.texture },
            uTouch: { value: null },
        };
        var material = new THREE.RawShaderMaterial({
            uniforms: uniforms,
            vertexShader: glslify(this.vertexShader),
            fragmentShader: glslify(this.fragmentShader),
            depthTest: false,
            transparent: true,
        });
        // Geometry
        var geometry = new THREE.InstancedBufferGeometry();
        // Positions
        var positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);
        positions.setXYZ(0, -0.5, 0.5, 0.0);
        positions.setXYZ(1, 0.5, 0.5, 0.0);
        positions.setXYZ(2, -0.5, -0.5, 0.0);
        positions.setXYZ(3, 0.5, -0.5, 0.0);

        // Add the position attribute to the geometry object
        geometry.addAttribute('position', positions);

        // UVs
        var uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2);
        uvs.setXYZ(0, 0.0, 0.0);
        uvs.setXYZ(1, 1.0, 0.0);
        uvs.setXYZ(2, 0.0, 1.0);
        uvs.setXYZ(3, 1.0, 1.0);

        // Add the uv attribute to the geometry object
        geometry.addAttribute('uv', uvs);

        // Index
        var indexBuffer = new Uint16Array([0, 2, 1, 2, 3, 1]);
        var index = new THREE.BufferAttribute(indexBuffer, 1);

        // Set the index of the geometry object
        geometry.setIndex(index);

        var indices = new Uint16Array(numVisible);
        var offsets = new Float32Array(numVisible * 3);
        var angles = new Float32Array(numVisible);

        for (var i = 0, j = 0; i < this.numPoints; i++) {
            if (originalColors[i * 4 + 0] <= threshold) {
                continue;
            }

            offsets[j * 3 + 0] = i % this.width;
            offsets[j * 3 + 1] = Math.floor(i / this.width);

            indices[j] = i;

            angles[j] = Math.random() * Math.PI;

            j++;
        }

        var pindex = new THREE.InstancedBufferAttribute(indices, 1, false);
        var offset = new THREE.InstancedBufferAttribute(offsets, 3, false);
        var angle = new THREE.InstancedBufferAttribute(angles, 1, false);

        geometry.addAttribute('pindex', pindex);
        geometry.addAttribute('offset', offset);
        geometry.addAttribute('angle', angle);

        this.object3D = new THREE.Mesh(geometry, material);
        this.container.add(this.object3D);
    }

    /**
     * Initialize the box where the particles can be hit by the mouse
     */
    Particles.prototype.initHitArea = function () {
        var geometry = new THREE.PlaneGeometry(this.width, this.height, 1, 1);
        var material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, depthTest: false });
        material.visible = false;

        this.hitArea = new THREE.Mesh(geometry, material);
        this.container.add(this.hitArea);
    }

    /**
     * Initialize particles mouse touch
     */
	Particles.prototype.initTouch = function () {
		if (!this.touch) {
            this.touch = new TouchTexture(this);
        }

		this.object3D.material.uniforms.uTouch.value = this.touch.texture;
	}

    /**
     * Update the position of the particles
     */
    Particles.prototype.update = function (delta) {
        if (!this.object3D) {
            return;
        }

		if (this.touch) {
            this.touch.update();
        }

        this.object3D.material.uniforms.uTime.value += delta;
    }

    /**
     * Resize the particles
     */
    Particles.prototype.resize = function () {
        if (!this.object3D) {
            return;
        }

        var scale = this.webgl.fovHeight / this.height;

        this.object3D.scale.set(scale, scale, 1);
        this.hitArea.scale.set(scale, scale, 1);
    }

    /**
     * Show the particles
     */
    Particles.prototype.show = function (time) {
        time = time == undefined ? 1.00 : time;

		// Reset
        TweenLite.fromTo(
            this.object3D.material.uniforms.uSize,
            time,
            { value: 0.5 },
            { value: this.webgl.options.particlesSize });
        TweenLite.to(
            this.object3D.material.uniforms.uRandom,
            time,
            { value: this.webgl.options.particlesDepth });
        TweenLite.fromTo(this.object3D.material.uniforms.uDepth,
            time * 1.5,
            { value: 1000.0 },
            { value: this.webgl.options.particlesDepth });

        this.addListeners();
    }

    /**
     * Add event listeners to the particles
     */
    Particles.prototype.addListeners = function () {
		this.handlerInteractiveMove = this.onInteractiveMove.bind(this);

		this.webgl.interactive.addListener('interactive-move', this.handlerInteractiveMove);
		this.webgl.interactive.objects.push(this.hitArea);
        this.webgl.interactive.enable();
    }

    /**
     * On interactive control touch move
     */
    Particles.prototype.onInteractiveMove = function (e) {
        var uv = e.intersectionData.uv;

		if (this.touch) {
            this.touch.addTouch(uv);
        }
    }


    /**
     * Touch Texture
     */
    var TouchTexture = function (parent) {
		this.parent = parent;
		this.size = 64;
		this.maxAge = 120;
		this.radius = parent.webgl.options.touchRadius;
        this.trail = [];

        this.init();
    }

    /**
     * Initialize touch texture
     */
    TouchTexture.prototype.init = function () {
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.canvas.height = this.size;
		this.ctx = this.canvas.getContext('2d');
		this.ctx.fillStyle = 'black';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		this.texture = new THREE.Texture(this.canvas);

		this.canvas.id = 'touchTexture';
		this.canvas.style.width = this.canvas.style.height = (this.canvas.width + 'px');
    }

    /**
     * Update particles on touch
     */
	TouchTexture.prototype.update = function (delta) {
        this.clear();
        var self = this;

        // Age Points
		this.trail.forEach(function (point, i) {
            point.age++;

            // Remove old
			if (point.age > self.maxAge) {
				self.trail.splice(i, 1);
			}
		});

		this.trail.forEach(function (point, i) {
			self.drawTouch(point);
		});

		this.texture.needsUpdate = true;
    }

    /**
     * Clear particles on touch
     */
	TouchTexture.prototype.clear = function () {
		this.ctx.fillStyle = 'black';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Add touch point
     */
    TouchTexture.prototype.addTouch = function (point) {
		var force = 0;
        var last = this.trail[this.trail.length - 1];

		if (last) {
			var dx = last.x - point.x;
			var dy = last.y - point.y;
            var dd = dx * dx + dy * dy;

			force = Math.min(dd * 10000, 1);
        }

		this.trail.push({ x: point.x, y: point.y, age: 0, force: force });
    }

    /**
     * Draw touch particles
     */
	TouchTexture.prototype.drawTouch = function (point) {
		var pos = {
			x: point.x * this.size,
			y: (1 - point.y) * this.size
        };
        var ease = easeOutSine;
        var intensity = 1;

		if (point.age < this.maxAge * 0.3) {
			intensity = ease(point.age / (this.maxAge * 0.3), 0, 1, 1);
		} else {
			intensity = ease(1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7), 0, 1, 1);
		}

		intensity *= point.force;

		var radius = this.size * this.radius * intensity;
        var grd = this.ctx.createRadialGradient(pos.x, pos.y, radius * 0.25, pos.x, pos.y, radius);

		grd.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
		grd.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

		this.ctx.beginPath();
		this.ctx.fillStyle = grd;
		this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
		this.ctx.fill();
    }


    /**
     * Interactive Controls
     */
    var InteractiveControls = function (camera, el, passiveEvent) {
        EventEmitter.call(this);

		this.camera = camera;
        this.el = el;
        this.passiveEvent = passiveEvent;

		this.plane = new THREE.Plane();
		this.raycaster = new THREE.Raycaster();

		this.mouse = new THREE.Vector2();
		this.offset = new THREE.Vector3();
		this.intersection = new THREE.Vector3();

		this.objects = [];
		this.hovered = null;
		this.selected = null;

		this.isDown = false;

		this.mobile = mobile();

		this.enable();
    }

    // Extend EventEmitter
    InteractiveControls.prototype = Object.create(EventEmitter.prototype);
    InteractiveControls.prototype.constructor = InteractiveControls;

    /**
     * Enable Interactive Controls
     */
    InteractiveControls.prototype.enable = function () {
        if (this._enabled) {
            return;
        }

        this.addListeners();
        this._enabled = true;
    }

    /**
     * Add interactive controls event listeners
     */
    InteractiveControls.prototype.addListeners = function () {
		this.handlerDown = this.onDown.bind(this);
		this.handlerMove = this.onMove.bind(this);
		this.handlerUp = this.onUp.bind(this);
		this.handlerLeave = this.onLeave.bind(this);

		if (this.mobile) {
			this.el.addEventListener('touchstart', this.handlerDown, this.passiveEvent);
			this.el.addEventListener('touchmove', this.handlerMove, this.passiveEvent);
			this.el.addEventListener('touchend', this.handlerUp, this.passiveEvent);
		} else {
			this.el.addEventListener('mousedown', this.handlerDown);
			this.el.addEventListener('mousemove', this.handlerMove);
			this.el.addEventListener('mouseup', this.handlerUp);
            this.el.addEventListener('mouseleave', this.handlerLeave);
		}
	}

    /**
     * Resize interactive control
     */
    InteractiveControls.prototype.resize = function (x, y, width, height) {
		if (x || y || width || height) {
			this.rect = { x: x, y: y, width: width, height: height };
		} else {
			this.rect = this.el.getBoundingClientRect();
		}
    }

    /**
     * On move interaction
     */
    InteractiveControls.prototype.onMove = function (e) {
        var t = (e.touches) ? e.touches[0] : e;
		var touch = { x: t.clientX, y: t.clientY };

		this.mouse.x = ((touch.x + this.rect.x) / this.rect.width) * 2 - 1;
		this.mouse.y = -((touch.y + this.rect.y) / this.rect.height) * 2 + 1;

		this.raycaster.setFromCamera(this.mouse, this.camera);

		var intersects = this.raycaster.intersectObjects(this.objects);

		if (intersects.length > 0) {
			var object = intersects[0].object;
			this.intersectionData = intersects[0];

			this.plane.setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(this.plane.normal), object.position);

			if (this.hovered !== object) {
				this.emit('interactive-out', { object: this.hovered });
				this.emit('interactive-over', { object: object });
				this.hovered = object;
			} else {
				this.emit('interactive-move', { object: object, intersectionData: this.intersectionData });
			}
		} else {
			this.intersectionData = null;

			if (this.hovered !== null) {
				this.emit('interactive-out', { object: this.hovered });
				this.hovered = null;
			}
		}
    }

    /**
     * On down interaction
     */
	InteractiveControls.prototype.onDown = function (e) {
		this.isDown = true;
		this.onMove(e);

		this.emit('interactive-down', {
            object: this.hovered,
            previous: this.selected,
            intersectionData: this.intersectionData
        });
		this.selected = this.hovered;

		if (this.selected) {
			if (this.raycaster.ray.intersectPlane(this.plane, this.intersection)) {
				this.offset.copy(this.intersection).sub(this.selected.position);
			}
		}
    }

    /**
     * On up interaction
     */
    InteractiveControls.prototype.onUp = function (e) {
		this.isDown = false;

		this.emit('interactive-up', { object: this.hovered });
    }

    /**
     * On leave interaction
     */
    InteractiveControls.prototype.onLeave = function (e) {
		this.onUp(e);

		this.emit('interactive-out', { object: this.hovered });
		this.hovered = null;
    }

    /**
     * Create an ajax request
     */
    function loadShader(filename, callback) {
        var req = new XMLHttpRequest();
        req.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                callback(req.responseText);
            }
        }
        req.open('GET', '/shaders/' + filename, false);
        req.send();
    }

    /**
     * Ease out easing
     */
    function easeOutSine(t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
    };


    // Export into the window object
    window.ImageParticles = ImageParticles;

})();
