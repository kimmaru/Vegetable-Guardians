import { GameObject } from './GameObject.js';
import { CONFIG } from './config.js';

export class Bullet extends GameObject {
    constructor(x, y, isPlayer = true) {
        const config = isPlayer ? CONFIG.BULLET : CONFIG.ENEMY_BULLET;
        super(x, y, config.WIDTH, config.HEIGHT);
        
        this.isPlayer = isPlayer;
        this.damage = config.DAMAGE;
        this.speed = config.SPEED;
        this.color = config.COLOR;
        this.vy = isPlayer ? -this.speed : this.speed;
        this.vx = 0; // Horizontal velocity for angled shots
        
        // Trail effect
        this.trail = [];
        this.maxTrailLength = 5;
    }

    update(deltaTime) {
        // Store position for trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        this.y += this.vy;
        this.x += this.vx;

        // Remove if off screen (with margin for angled bullets)
        if (this.y < -this.height - 50 || this.y > CONFIG.CANVAS_HEIGHT + 50 ||
            this.x < -this.width - 50 || this.x > CONFIG.CANVAS_WIDTH + 50) {
            this.destroy();
        }
    }

    draw(ctx) {
        // Draw trail
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = (i + 1) / this.trail.length * 0.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.fillRect(
                this.trail[i].x + this.width / 4,
                this.trail[i].y,
                this.width / 2,
                this.height
            );
        }
        ctx.globalAlpha = 1;

        // Draw bullet
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        // Draw bullet shape
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
}

