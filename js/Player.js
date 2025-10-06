import { GameObject } from './GameObject.js';
import { CONFIG, EMOJIS } from './config.js';
import { clamp, randomChoice } from './utils.js';

export class Player extends GameObject {
    constructor(x, y) {
        super(x, y, CONFIG.PLAYER.WIDTH, CONFIG.PLAYER.HEIGHT);
        this.health = CONFIG.PLAYER.MAX_HEALTH;
        this.maxHealth = CONFIG.PLAYER.MAX_HEALTH;
        this.speed = CONFIG.PLAYER.SPEED;
        this.lastShootTime = 0;
        this.shootCooldown = CONFIG.PLAYER.SHOOT_COOLDOWN;
        this.emoji = randomChoice(EMOJIS.PLAYER);
        
        // Power-up states
        this.powerUps = {
            rapidFire: false,
            shield: false,
            doubleShot: false,
        };
        this.powerUpTimers = {};
        
        // Shield effect
        this.shieldAlpha = 0;
    }

    update(deltaTime, canvasWidth) {
        // Movement
        this.x += this.vx;
        this.y += this.vy;

        // Keep player within bounds
        this.x = clamp(this.x, 0, canvasWidth - this.width);
        this.y = clamp(this.y, 0, CONFIG.CANVAS_HEIGHT - this.height);

        // Update power-up timers
        const currentTime = Date.now();
        for (const [powerUp, endTime] of Object.entries(this.powerUpTimers)) {
            if (currentTime >= endTime) {
                this.powerUps[powerUp] = false;
                delete this.powerUpTimers[powerUp];
            }
        }

        // Update shield animation
        if (this.powerUps.shield) {
            this.shieldAlpha = 0.5 + Math.sin(currentTime / 100) * 0.3;
        }
        
        // Health regeneration
        if (this.powerUps.regen) {
            if (!this.lastRegenTime) this.lastRegenTime = currentTime;
            if (currentTime - this.lastRegenTime >= 1000) {
                this.heal(1);
                this.lastRegenTime = currentTime;
            }
        }
    }

    draw(ctx) {
        // Draw shield
        if (this.powerUps.shield) {
            ctx.save();
            ctx.globalAlpha = this.shieldAlpha;
            ctx.strokeStyle = '#95E1D3';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width / 2 + 10,
                0,
                Math.PI * 2
            );
            ctx.stroke();
            ctx.restore();
        }

        // Draw player emoji (reduced size to prevent stretching)
        ctx.font = `${this.height * 0.7}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x + this.width / 2, this.y + this.height / 2);

        // Draw power-up indicators
        this.drawPowerUpIndicators(ctx);
    }

    drawPowerUpIndicators(ctx) {
        let indicatorY = this.y + this.height + 10;
        
        if (this.powerUps.rapidFire) {
            ctx.font = '16px Arial';
            ctx.fillText('⚡', this.x + this.width / 2, indicatorY);
            indicatorY += 20;
        }
        
        if (this.powerUps.doubleShot) {
            ctx.font = '16px Arial';
            ctx.fillText('✨', this.x + this.width / 2, indicatorY);
        }
    }

    canShoot() {
        const currentTime = Date.now();
        const cooldown = this.powerUps.rapidFire ? 
            this.shootCooldown / 2 : this.shootCooldown;
        
        if (currentTime - this.lastShootTime >= cooldown) {
            this.lastShootTime = currentTime;
            return true;
        }
        return false;
    }

    takeDamage(amount) {
        if (this.powerUps.shield) {
            // Shield absorbs damage
            return false;
        }
        
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.destroy();
            return true;
        }
        return false;
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    activatePowerUp(type, duration) {
        this.powerUps[type] = true;
        this.powerUpTimers[type] = Date.now() + duration;
    }

    getHealthPercentage() {
        return (this.health / this.maxHealth) * 100;
    }
}

