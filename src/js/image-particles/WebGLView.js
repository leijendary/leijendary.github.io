import { Clock, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import requestAnimationFrame from '../util/request-animation-frame';
import InteractiveControls from './InteractiveControls';
import Particles from './Particles';

export default class WebGLView {

  constructor(element, options = {}) {
    this.element = typeof element === 'object' ? element : document.querySelector(element);
    this.options = {
      particlesRandom: options.particlesRandom || 2,
      particlesDepth: options.particlesDepth || 3,
      particlesSize: options.particlesSize || 1,
      touchRadius: options.touchRadius || 5,
      imageX: options.imageX || 0,
      imageY: options.imageY || 0,
      scale: options.scale || 1,
      id: options.id || 'particles',
      image: options.image
    }
  }

  /**
   * Initialize particles
   */
  init() {
    // Scene
    this.scene = new Scene();
    // Camera
    this.camera = new PerspectiveCamera(50, this.element.clientWidth / this.element.clientHeight, 1, 10000);
    this.camera.position.z = 300;
    // Renderer
    this.renderer = new WebGLRenderer({ alpha: true, antialias: true });
    // Set the id of the renderer
    this.renderer.domElement.id = this.options.id;
    // Clock
    this.clock = new Clock(true);
    // Texture
    this.particles = new Particles(this);
    // Initialize interactive controls
    this.interactive = new InteractiveControls(this.camera, this.renderer.domElement);
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

    requestAnimationFrame(this.animationHandler);
  }

  /**
   * Resize WebGL
   */
  resize() {
    if (!this.renderer) {
      return;
    }

    let imageX = this.options.imageX;
    let imageY = this.options.imageY;

    if (typeof imageX === 'function') {
      imageX = imageX();
    }

    if (typeof imageY === 'function') {
      imageY = imageY();
    }

    this.camera.aspect = this.element.clientWidth / this.element.clientHeight;
    this.camera.updateProjectionMatrix();

    this.fovHeight = 2 * Math.tan((this.camera.fov * Math.PI) / 180 / 2) * this.camera.position.z;

    this.scene.position.x = imageX;
    this.scene.position.y = imageY;

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
}