import * as THREE from 'three';
import requestAnimationFrame from '../util/request-animation-frame';
import Particles from './Particles';
import InteractiveControls from './InteractiveControls';

export default class ImageParticles {

    constructor(element, options = {}) {
        this.element = typeof element === 'object' ? element : document.querySelector(element);
        this.options = {
            particlesRandom: options.particlesRandom || 2,
            particlesDepth: options.particlesDepth || 3,
            particlesSize: options.particlesSize || 1,
            touchRadius: options.touchRadius || 5,
            imageX: options.imageX || 0.07,
            imageY: options.imageY || 3,
            id: options.id || 'particles'
        }
    }

    /**
     * Initialize particles
     */
    init() {
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
    addListeners() {
        this.animationHandler = this.animate.bind(this);

        window.addEventListener('resize', this.resize.bind(this));
    }

    /**
     * Animate the image canvas
     */
    animate() {
        this.update();
        this.draw();

        console.log(requestAnimationFrame);

        requestAnimationFrame(this.animationHandler);
    }

    /**
     * Resize WebGL
     */
    resize() {
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
    update() {
        const delta = this.clock.getDelta();

        if (this.particles) {
            this.particles.update(delta);
        }
    }

    /**
     * Draw the particles in the WebGL
     */
    draw() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Check if the passive event option is supported
     */
    passiveEvent() {
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
                let opts = Object.defineProperty({}, 'passive', {
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
}