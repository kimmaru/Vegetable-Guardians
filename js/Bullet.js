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
        
        // Visual effects based on abilities
        this.isPiercing = false;
        this.isExplosive = false;
        this.isCritical = false;
        this.isFreezing = false;
        
        // Spiral bullet properties
        this.isSpiral = false;
        this.spiralTime = 0;
        this.spiralRadius = 0;
        this.spiralSpeed = 0;
        this.spiralCenterVx = 0;
        this.spiralCenterVy = 0;
    }

    update(deltaTime, enemies = []) {
        this.age += deltaTime;
        
        // Lifespan check
        if (this.lifespan && this.age > this.lifespan) {
            this.destroy();
            return;
        }
        
        // Spiral behavior
        if (this.isSpiral) {
            this.spiralTime += deltaTime * 0.005;
            
            // Calculate spiral offset
            const angle = this.spiralTime * this.spiralSpeed;
            const offsetX = Math.cos(angle) * this.spiralRadius * (this.spiralTime / 100);
            const offsetY = Math.sin(angle) * this.spiralRadius * (this.spiralTime / 100);
            
            // Move forward while spiraling
            this.x += this.spiralCenterVx + offsetX * 0.1;
            this.y += this.spiralCenterVy + offsetY * 0.1;
        }
        // Homing logic
        else if (this.isHoming && this.isPlayer && enemies.length > 0) {
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
            
            this.y += this.vy;
            this.x += this.vx;
        } else {
            // Normal movement
            this.y += this.vy;
            this.x += this.vx;
        }
        
        // Store position for trail (not for lasers)
        if (!this.isLaser) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }

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
        
        // Determine bullet color based on abilities
        let bulletColor = this.color;
        let glowColor = this.color;
        let glowIntensity = 10;
        
        if (this.isExplosive) {
            bulletColor = '#FF6B00';
            glowColor = '#FF6B00';
            glowIntensity = 20;
        } else if (this.isPiercing) {
            bulletColor = '#00FFFF';
            glowColor = '#00FFFF';
            glowIntensity = 15;
        } else if (this.isFreezing) {
            bulletColor = '#88CCFF';
            glowColor = '#88CCFF';
            glowIntensity = 15;
        } else if (this.isCritical) {
            bulletColor = '#FFD700';
            glowColor = '#FFD700';
            glowIntensity = 18;
        }
        
        // Normal bullet trail
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = (i + 1) / this.trail.length * 0.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = bulletColor;
            ctx.fillRect(
                this.trail[i].x + this.width / 4,
                this.trail[i].y,
                this.width / 2,
                this.height
            );
        }
        ctx.globalAlpha = 1;

        // Draw bullet
        ctx.fillStyle = bulletColor;
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = glowColor;
        
        // Draw bullet shape
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        // Extra effect for explosive bullets
        if (this.isExplosive) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
        
        // Extra effect for piercing bullets
        if (this.isPiercing) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(this.x + this.width / 3, this.y, this.width / 3, this.height);
            ctx.restore();
        }
        
        ctx.shadowBlur = 0;
    }
}

