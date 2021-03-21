import glslify from 'glslify';
import { TweenLite } from 'gsap';
import {
  BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  RawShaderMaterial,
  RGBFormat,
  TextureLoader,
  Vector2
} from 'three';
import fragmentShader from '../../../shaders/particle.frag';
import vertexShader from '../../../shaders/particle.vert';
import TouchTexture from './TouchTexture';

export default class Particles {

  constructor (webgl) {
    this.webgl = webgl;
    // Object3D Container
    this.container = new Object3D();
    // Texture Loader
    this.loader = new TextureLoader();
    // Interactive move listener
    this.handlerInteractiveMove = this.onInteractiveMove.bind(this);

    // Initialize the image into the texture loader
    this.init(webgl.options.image);
  }

  /**
   * Initialize the image into the texture loader
   */
  init(image, time) {
    this.loader.load(image, (texture) => {
      this.texture = texture;
      this.texture.minFilter = LinearFilter;
      this.texture.magFilter = LinearFilter;
      this.texture.format = RGBFormat;
      this.width = texture.image.width;
      this.height = texture.image.height;

      this.initPoints();
      this.initHitArea();
      this.initTouch();
      this.resize();
      this.show(time);
    });
  }

  /**
   * Initialize particle points
   */
  initPoints() {
    this.numPoints = this.width * this.height;

    let numVisible = 0;
    let threshold = 34;
    let originalColors;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = this.width;
    canvas.height = this.height;
    ctx.scale(1, -1);
    ctx.drawImage(this.texture.image, 0, 0, this.width, this.height * -1);

    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    originalColors = new Float32Array(imgData.data);

    for (let i = 0; i < this.numPoints; i++) {
      if (originalColors[i * 4 + 0] > threshold) {
        numVisible++;
      }
    }

    const uniforms = {
      uTime: { value: 2 },
      uRandom: { value: this.webgl.options.particlesRandom },
      uDepth: { value: this.webgl.options.particlesDepth },
      uSize: { value: this.webgl.options.particlesSize },
      uTextureSize: { value: new Vector2(this.width, this.height) },
      uTexture: { value: this.texture },
      uTouch: { value: null },
    };
    const material = new RawShaderMaterial({
      uniforms,
      vertexShader: glslify(vertexShader),
      fragmentShader: glslify(fragmentShader),
      depthTest: false,
      transparent: true,
    });
    // Geometry
    const geometry = new InstancedBufferGeometry();
    // Positions
    const positions = new BufferAttribute(new Float32Array(4 * 3), 3);
    positions.setXYZ(0, -0.5, 0.5, 0.0);
    positions.setXYZ(1, 0.5, 0.5, 0.0);
    positions.setXYZ(2, -0.5, -0.5, 0.0);
    positions.setXYZ(3, 0.5, -0.5, 0.0);

    // Add the position attribute to the geometry object
    geometry.setAttribute('position', positions);

    // UVs
    const uvs = new BufferAttribute(new Float32Array(4 * 2), 2);
    uvs.setXYZ(0, 0.0, 0.0);
    uvs.setXYZ(1, 1.0, 0.0);
    uvs.setXYZ(2, 0.0, 1.0);
    uvs.setXYZ(3, 1.0, 1.0);

    // Add the uv attribute to the geometry object
    geometry.setAttribute('uv', uvs);

    // Index
    const indexBuffer = new Uint16Array([0, 2, 1, 2, 3, 1]);
    const index = new BufferAttribute(indexBuffer, 1);

    // Set the index of the geometry object
    geometry.setIndex(index);

    const indices = new Uint16Array(numVisible);
    const offsets = new Float32Array(numVisible * 3);
    const angles = new Float32Array(numVisible);

    for (let i = 0, j = 0; i < this.numPoints; i++) {
      if (originalColors[i * 4 + 0] <= threshold) {
        continue;
      }

      offsets[j * 3 + 0] = i % this.width;
      offsets[j * 3 + 1] = Math.floor(i / this.width);

      indices[j] = i;

      angles[j] = Math.random() * Math.PI;

      j++;
    }

    const pindex = new InstancedBufferAttribute(indices, 1, false);
    const offset = new InstancedBufferAttribute(offsets, 3, false);
    const angle = new InstancedBufferAttribute(angles, 1, false);

    geometry.setAttribute('pindex', pindex);
    geometry.setAttribute('offset', offset);
    geometry.setAttribute('angle', angle);

    this.object3D = new Mesh(geometry, material);
    this.container.add(this.object3D);
  }

  /**
   * Initialize the box where the particles can be hit by the mouse
   */
  initHitArea() {
    const geometry = new PlaneGeometry(this.width, this.height, 1, 1);
    const material = new MeshBasicMaterial({ color: 0xffffff, wireframe: true, depthTest: false });
    material.visible = false;

    this.hitArea = new Mesh(geometry, material);
    this.container.add(this.hitArea);
  }

  /**
   * Initialize particles mouse touch
   */
  initTouch() {
    if (!this.touch) {
      this.touch = new TouchTexture(this);
    }

		this.object3D.material.uniforms.uTouch.value = this.touch.texture;
  }

  /**
   * Update the position of the particles
   */
  update(delta) {
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
  resize() {
    if (!this.object3D) {
      return;
    }

    let scale = this.webgl.options.scale;

    if (typeof scale == 'function') {
      scale = scale();
    }

    scale = (this.webgl.fovHeight / this.height) * scale;

    this.object3D.scale.set(scale, scale, 1);
    this.hitArea.scale.set(scale, scale, 1);
  }

  /**
   * Show the particles
   */
  show(time = 1.00) {
		// Reset
    TweenLite.fromTo(
      this.object3D.material.uniforms.uSize,
      time,
      { value: 0.5 },
      { value: this.webgl.options.particlesSize }
    );
    TweenLite.to(
      this.object3D.material.uniforms.uRandom,
      time,
      { value: this.webgl.options.particlesDepth }
    );
    TweenLite.fromTo(
      this.object3D.material.uniforms.uDepth,
      time * 1.5,
      { value: 1000.0 },
      { value: this.webgl.options.particlesDepth }
    );

    this.addListeners();
  }

  /**
   * Add event listeners to the particles
   */
  addListeners() {
		this.webgl.interactive.addListener('interactive-move', this.handlerInteractiveMove);
		this.webgl.interactive.objects.push(this.hitArea);
    this.webgl.interactive.enable();
  }

  /**
   * Remove event listeners from the particles
   */
  removeListeners() {
		this.webgl.interactive.removeListener('interactive-move', this.handlerInteractiveMove);

    const index = this.webgl.interactive.objects.findIndex(obj => obj === this.hitArea);

		this.webgl.interactive.objects.splice(index, 1);
		this.webgl.interactive.disable();
	}

  /**
   * On interactive control touch move
   */
  onInteractiveMove(e) {
    const uv = e.intersectionData.uv;

		if (this.touch) {
      this.touch.addTouch(uv);
    }
  }

  /**
   * Remove elements
   */
  destroy() {
		if (!this.object3D) {
      return;
    }

		this.object3D.parent.remove(this.object3D);
		this.object3D.geometry.dispose();
		this.object3D.material.dispose();
		this.object3D = null;

		if (!this.hitArea) {
      return;
    }

		this.hitArea.parent.remove(this.hitArea);
		this.hitArea.geometry.dispose();
		this.hitArea.material.dispose();
    this.hitArea = null;
	}
}