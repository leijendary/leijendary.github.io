import { Texture } from 'three';

export default class TouchTexture {

    constructor(parent) {
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
    init() {
        this.canvas = document.createElement('canvas');
		this.canvas.width = this.canvas.height = this.size;
		this.ctx = this.canvas.getContext('2d');
		this.ctx.fillStyle = 'black';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		this.texture = new Texture(this.canvas);

		this.canvas.id = 'touchTexture';
		this.canvas.style.width = this.canvas.style.height = (this.canvas.width + 'px');
    }

    /**
     * Update particles on touch
     */
    update() {
        this.clear();

        // Age Points
		this.trail.forEach((point, i) => {
            point.age++;

            // Remove old
			if (point.age > this.maxAge) {
				this.trail.splice(i, 1);
			}
		});

		this.trail.forEach((point, i) => {
			this.drawTouch(point);
		});

		this.texture.needsUpdate = true;
    }

    /**
     * Clear particles on touch
     */
    clear() {
        this.ctx.fillStyle = 'black';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Add touch point
     */
    addTouch(point) {
        let force = 0;
        const last = this.trail[this.trail.length - 1];

		if (last) {
			const dx = last.x - point.x;
			const dy = last.y - point.y;
            const dd = dx * dx + dy * dy;

			force = Math.min(dd * 10000, 1);
        }

		this.trail.push({ x: point.x, y: point.y, age: 0, force: force });
    }

    /**
     * Draw touch particles
     */
    drawTouch(point) {
        const pos = {
			x: point.x * this.size,
			y: (1 - point.y) * this.size
        };
        const ease = this.easeOutSine;
        let intensity = 1;

		if (point.age < this.maxAge * 0.3) {
			intensity = ease(point.age / (this.maxAge * 0.3), 0, 1, 1);
		} else {
			intensity = ease(1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7), 0, 1, 1);
		}

        intensity *= point.force;

		const radius = this.size * this.radius * intensity;
        const grd = this.ctx.createRadialGradient(pos.x, pos.y, radius * 0.25, pos.x, pos.y, radius);

		grd.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
		grd.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

		this.ctx.beginPath();
		this.ctx.fillStyle = grd;
		this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
		this.ctx.fill();
    }

    /**
     * Ease out easing
     */
    easeOutSine(t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
    };
}