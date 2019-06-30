import EventEmitter from 'events';
import { Plane, Raycaster, Vector2, Vector3 } from 'three';
import { passiveEvent } from '../util/event';
import mobile from '../util/mobile';

export default class InteractiveControls extends EventEmitter {

    constructor(camera, el) {
        super();

        this.camera = camera;
        this.el = el;

		this.plane = new Plane();
		this.raycaster = new Raycaster();

		this.mouse = new Vector2();
		this.offset = new Vector3();
		this.intersection = new Vector3();

		this.objects = [];
		this.hovered = null;
		this.selected = null;

		this.isDown = false;

		this.enable();
    }

    get enabled() { return this._enabled; }

    /**
     * Enable Interactive Controls
     */
    enable() {
        if (this._enabled) {
            return;
        }

        this.addListeners();
        this._enabled = true;
	}

	/**
	 * Disable Interactive Controls
	 */
	disable() {
		if (!this._enabled) {
			return;
		}

		this.removeListeners();
		this._enabled = false;
	}

    /**
     * Add interactive controls event listeners
     */
    addListeners() {
        this.handlerDown = this.onDown.bind(this);
		this.handlerMove = this.onMove.bind(this);
		this.handlerUp = this.onUp.bind(this);
		this.handlerLeave = this.onLeave.bind(this);

		if (mobile()) {
			this.el.addEventListener('touchstart', this.handlerDown, passiveEvent);
			this.el.addEventListener('touchmove', this.handlerMove, passiveEvent);
			this.el.addEventListener('touchend', this.handlerUp, passiveEvent);
		} else {
			this.el.addEventListener('mousedown', this.handlerDown);
			this.el.addEventListener('mousemove', this.handlerMove);
			this.el.addEventListener('mouseup', this.handlerUp);
            this.el.addEventListener('mouseleave', this.handlerLeave);
		}
	}

	/**
	 * Remove interactive controls event listeners
	 */
	removeListeners() {
		if (mobile()) {
			this.el.removeEventListener('touchstart', this.handlerDown, passiveEvent);
			this.el.removeEventListener('touchmove', this.handlerMove, passiveEvent);
			this.el.removeEventListener('touchend', this.handlerUp, passiveEvent);
		} else {
			this.el.removeEventListener('mousedown', this.handlerDown);
			this.el.removeEventListener('mousemove', this.handlerMove);
			this.el.removeEventListener('mouseup', this.handlerUp);
			this.el.removeEventListener('mouseleave', this.handlerLeave);
		}
	}

    /**
     * Resize interactive control
     */
    resize(x, y, width, height) {
        if (x || y || width || height) {
			this.rect = { x: x, y: y, width: width, height: height };
		} else {
			this.rect = this.el.getBoundingClientRect();
		}
    }

    /**
     * On move interaction
     */
    onMove(e) {
        const t = (e.touches) ? e.touches[0] : e;
		const touch = { x: t.clientX, y: t.clientY };

		this.mouse.x = ((touch.x + this.rect.x) / this.rect.width) * 2 - 1;
		this.mouse.y = -((touch.y + this.rect.y) / this.rect.height) * 2 + 1;

		this.raycaster.setFromCamera(this.mouse, this.camera);

		const intersects = this.raycaster.intersectObjects(this.objects);

		if (intersects.length > 0) {
			const object = intersects[0].object;
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
    onDown(e) {
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
    onUp(e) {
        this.isDown = false;

		this.emit('interactive-up', { object: this.hovered });
    }

    /**
     * On leave interaction
     */
    onLeave(e) {
        this.onUp(e);

		this.emit('interactive-out', { object: this.hovered });
		this.hovered = null;
    }
}