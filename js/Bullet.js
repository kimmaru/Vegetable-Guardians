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
        
        // Special bullet types
        this.isLaser = false;
        this.isHoming = false;
        this.homingStrength = 0;
        this.lifespan = null;
        this.age = 0;
    }

    update(deltaTime, enemies = []) {
        this.age += deltaTime;
        
        // Lifespan check
        if (this.lifespan && this.age > this.lifespan) {
            this.destroy();
            return;
        }
        
        // Homing logic
        if (this.isHoming && this.isPlayer && enemies.length > 0) {
            // Find nearest enemy
            let nearestEnemy = null;
            let minDist = Infinity;
            
            for (const enemy of enemies) {
                if (!enemy.active) continue;
                const dx = (enemy.x + enemy.width / 2) - (this.x + this.width / 2);
                const dy = (enemy.y + enemy.height / 2) - (this.y + this.height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < minDist) {
                    minDist = dist;
                    nearestEnemy = enemy;
                }
            }
            
            // Home in on nearest enemy
            if (nearestEnemy) {
                const dx = (nearestEnemy.x + nearestEnemy.width / 2) - (this.x + this.width / 2);
                const dy = (nearestEnemy.y + nearestEnemy.height / 2) - (this.y + this.height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    this.vx += (dx / dist) * this.homingStrength * this.speed;
                    this.vy += (dy / dist) * this.homingStrength * this.speed;
                    
                    // Limit speed
                    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    if (currentSpeed > this.speed * 1.5) {
                        this.vx = (this.vx / currentSpeed) * this.speed * 1.5;
                        this.vy = (this.vy / currentSpeed) * this.speed * 1.5;
                    }
                }
            }
        }
        
        // Store position for trail (not for lasers)
        if (!this.isLaser) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }

        this.y += this.vy;
        this.x += this.vx;

        // Remove if off screen (with margin for angled bullets, except lasers)
        if (!this.isLaser && (this.y < -this.height - 50 || this.y > CONFIG.CANVAS_HEIGHT + 50 ||
            this.x < -this.width - 50 || this.x > CONFIG.CANVAS_WIDTH + 50)) {
            this.destroy();
        }
    }

    draw(ctx) {
        // Laser beam rendering
        if (this.isLaser) {
            ctx.save();
            ctx.fillStyle = '#00FFFF';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00FFFF';
            ctx.globalAlpha = 0.8;
            ctx.fillRect(this.x, 0, this.width, CONFIG.CANVAS_HEIGHT);
            
            // Laser core
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 1;
            ctx.fillRect(this.x + this.width / 4, 0, this.width / 2, CONFIG.CANVAS_HEIGHT);
            
            ctx.restore();
            return;
        }
        
        // Homing missile rendering
        if (this.isHoming) {
            ctx.save();
            ctx.fillStyle = '#FF00FF';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#FF00FF';
            
            // Missile body
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Missile trail
            ctx.globalAlpha = 0.5;
            for (let i = 0; i < this.trail.length; i++) {
                const alpha = (i + 1) / this.trail.length * 0.5;
                ctx.globalAlpha = alpha;
                ctx.fillRect(
                    this.trail[i].x,
                    this.trail[i].y,
                    this.width,
                    this.height
                );
            }
            
            ctx.restore();
            return;
        }
        
        // Normal bullet trail
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

