import { GameObject } from './GameObject.js';
import { CONFIG, EMOJIS } from './config.js';
import { randomChoice, randomInt } from './utils.js';

export class Enemy extends GameObject {
    constructor(x, y, speed, gameLevel = 1) {
        super(x, y, CONFIG.ENEMY.WIDTH, CONFIG.ENEMY.HEIGHT);
        // Health increases with game level
        this.maxHealth = CONFIG.ENEMY.BASE_HEALTH + (gameLevel - 1) * 10;
        this.health = this.maxHealth;
        this.speed = speed;
        this.vy = this.speed;
        
        // Select emoji based on wave/level
        let enemyPool;
        if (gameLevel <= 1) {
            enemyPool = EMOJIS.ENEMIES_WAVE_1;
        } else if (gameLevel <= 3) {
            enemyPool = EMOJIS.ENEMIES_WAVE_2;
        } else if (gameLevel <= 5) {
            enemyPool = EMOJIS.ENEMIES_WAVE_3;
        } else if (gameLevel <= 7) {
            enemyPool = EMOJIS.ENEMIES_WAVE_4;
        } else {
            enemyPool = EMOJIS.ENEMIES_WAVE_5;
        }
        this.emoji = randomChoice(enemyPool);
        this.points = CONFIG.ENEMY.POINTS;
        
        // Movement pattern - more variety
        this.movementType = randomInt(0, 6);
        this.time = 0;
        this.amplitude = randomInt(30, 80);
        this.frequency = randomInt(1, 4) / 1000;
        this.vx = 0;
        
        // Special movement properties
        this.circleRadius = randomInt(40, 80);
        this.circleSpeed = randomInt(1, 3) / 2000;
        this.initialX = x;
        this.dashSpeed = 0;
        this.isDashing = false;
        
        // Shooting
        this.canShoot = Math.random() < 0.3; // 30% of enemies can shoot
        this.lastShootTime = Date.now();
        this.shootInterval = randomInt(2000, 4000);
    }

    update(deltaTime) {
        this.time += deltaTime;

        // Different movement patterns
        switch (this.movementType) {
            case 0: // Straight down
                this.y += this.vy;
                break;
                
            case 1: // Sine wave
                this.y += this.vy;
                this.x += Math.sin(this.time * this.frequency) * this.amplitude * 0.02;
                break;
                
            case 2: // Zigzag
                this.y += this.vy;
                this.x += Math.cos(this.time * this.frequency * 2) * this.amplitude * 0.03;
                break;
                
            case 3: // Circular motion
                this.y += this.vy * 0.7;
                this.x = this.initialX + Math.sin(this.time * this.circleSpeed) * this.circleRadius;
                break;
                
            case 4: // Diagonal swooping
                this.y += this.vy;
                const swoop = Math.sin(this.time * this.frequency * 3) * this.amplitude;
                this.x += swoop * 0.04;
                break;
                
            case 5: // Stop and dash
                if (!this.isDashing && this.time % 2000 < 100) {
                    this.isDashing = true;
                    this.dashSpeed = this.vy * 3;
                }
                
                if (this.isDashing) {
                    this.y += this.dashSpeed;
                    this.dashSpeed *= 0.95;
                    if (this.dashSpeed < this.vy) {
                        this.isDashing = false;
                    }
                } else {
                    this.y += this.vy * 0.5;
                }
                break;
                
            case 6: // Wave pattern with horizontal drift
                this.y += this.vy;
                this.vx += Math.sin(this.time * this.frequency * 4) * 0.05;
                this.vx *= 0.98; // Damping
                this.x += this.vx;
                break;
        }

        // Keep enemy within horizontal bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CONFIG.CANVAS_WIDTH) {
            this.x = CONFIG.CANVAS_WIDTH - this.width;
        }
    }

    draw(ctx) {
        // Draw health bar
        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
            
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(this.x, this.y - 8, barWidth * healthPercent, barHeight);
        }

        // Draw enemy emoji with horizontal scaling
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(1.5, 1); // Scale horizontally 1.5x, vertically 1x
        ctx.font = `${this.height * 0.7}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        ctx.restore();
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        return false;
    }

    shouldShoot() {
        if (!this.canShoot) return false;
        
        const currentTime = Date.now();
        if (currentTime - this.lastShootTime >= this.shootInterval) {
            this.lastShootTime = currentTime;
            return true;
        }
        return false;
    }
}

