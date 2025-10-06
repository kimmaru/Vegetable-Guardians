import { CONFIG } from './config.js';
import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { Bullet } from './Bullet.js';
import { PowerUp } from './PowerUp.js';
import { ExplosionEffect, TextEffect } from './Particle.js';
import { checkCollision, randomInt, randomChoice, shakeScreen } from './utils.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        // Game state
        this.state = 'menu'; // menu, playing, paused, gameover
        this.score = 0;
        this.level = 1;
        this.isPaused = false;

        // Game objects
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.powerUps = [];
        this.effects = [];

        // Spawning
        this.lastEnemySpawn = 0;
        this.enemySpawnInterval = CONFIG.ENEMY.SPAWN_INTERVAL;

        // Auto shooting
        this.autoShoot = true;
        this.lastAutoShoot = 0;

        // Input
        this.keys = {};
        this.touchControls = {
            isActive: false,
            touchId: null,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            lastTapTime: 0
        };
        
        // Background
        this.stars = this.generateStars(100);

        // Time tracking
        this.lastTime = 0;

        // Bind methods
        this.update = this.update.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    generateStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * CONFIG.CANVAS_WIDTH,
                y: Math.random() * CONFIG.CANVAS_HEIGHT,
                size: Math.random() * 2,
                speed: Math.random() * 0.5 + 0.2,
                brightness: Math.random()
            });
        }
        return stars;
    }

    start() {
        // Reset game
        this.score = 0;
        this.level = 1;
        this.enemies = [];
        this.bullets = [];
        this.powerUps = [];
        this.effects = [];
        this.lastEnemySpawn = 0;
        this.enemySpawnInterval = CONFIG.ENEMY.SPAWN_INTERVAL;

        // Create player
        const startX = CONFIG.CANVAS_WIDTH / 2 - CONFIG.PLAYER.WIDTH / 2;
        const startY = CONFIG.CANVAS_HEIGHT - CONFIG.PLAYER.HEIGHT - 50;
        this.player = new Player(startX, startY);

        // Set up input listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        
        // Touch controls
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

        this.state = 'playing';
        this.isPaused = false;
        this.lastTime = performance.now();
        
        // Start game loop
        requestAnimationFrame(this.update);

        // Update UI
        this.updateUI();
    }

    stop() {
        this.state = 'gameover';
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        
        // Remove touch event listeners
        this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    pause() {
        this.isPaused = !this.isPaused;
    }

    handleKeyDown(e) {
        this.keys[e.key] = true;

        // Pause
        if (e.key === 'p' || e.key === 'P') {
            this.pause();
        }

        // Prevent spacebar scrolling
        if (e.key === ' ') {
            e.preventDefault();
        }
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (this.state !== 'playing') return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Check for double tap (pause/resume)
        const currentTime = Date.now();
        if (currentTime - this.touchControls.lastTapTime < 300) {
            this.pause();
            return;
        }
        this.touchControls.lastTapTime = currentTime;
        
        if (this.isPaused) return;
        
        this.touchControls.isActive = true;
        this.touchControls.touchId = touch.identifier;
        this.touchControls.startX = x;
        this.touchControls.startY = y;
        this.touchControls.currentX = x;
        this.touchControls.currentY = y;
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.touchControls.isActive || this.state !== 'playing' || this.isPaused) return;
        
        const touch = Array.from(e.touches).find(t => t.identifier === this.touchControls.touchId);
        if (!touch) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.touchControls.currentX = x;
        this.touchControls.currentY = y;
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.touchControls.isActive) return;
        
        this.touchControls.isActive = false;
        this.touchControls.touchId = null;
    }

    shoot() {
        if (!this.player || !this.player.canShoot()) return;

        const bulletX = this.player.x + this.player.width / 2 - CONFIG.BULLET.WIDTH / 2;
        const bulletY = this.player.y;

        if (this.player.powerUps.doubleShot) {
            // Shoot two bullets
            this.bullets.push(new Bullet(bulletX - 10, bulletY, true));
            this.bullets.push(new Bullet(bulletX + 10, bulletY, true));
        } else {
            // Shoot one bullet
            this.bullets.push(new Bullet(bulletX, bulletY, true));
        }
    }

    spawnEnemy() {
        const x = randomInt(0, CONFIG.CANVAS_WIDTH - CONFIG.ENEMY.WIDTH);
        const y = -CONFIG.ENEMY.HEIGHT;
        const speed = CONFIG.ENEMY.BASE_SPEED + (this.level - 1) * CONFIG.LEVELS.ENEMY_SPEED_INCREASE;
        
        this.enemies.push(new Enemy(x, y, speed));
    }

    spawnPowerUp(x, y) {
        if (Math.random() > CONFIG.POWERUP.SPAWN_CHANCE) return;

        const types = Object.keys(CONFIG.POWERUP.TYPES);
        const type = randomChoice(types);
        
        this.powerUps.push(new PowerUp(x, y, type));
    }

    update(currentTime) {
        if (this.state !== 'playing') return;
        if (this.isPaused) {
            this.lastTime = currentTime;
            requestAnimationFrame(this.update);
            return;
        }

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.drawBackground();

        // Handle player input
        this.handlePlayerMovement();
        
        // Auto shooting
        if (this.autoShoot && this.player && this.player.canShoot()) {
            const autoShootInterval = this.player.powerUps.rapidFire ? 100 : 250;
            if (currentTime - this.lastAutoShoot >= autoShootInterval) {
                this.shoot();
                this.lastAutoShoot = currentTime;
            }
        }

        // Update player
        if (this.player) {
            this.player.update(deltaTime, CONFIG.CANVAS_WIDTH);
            this.player.draw(this.ctx);
        }

        // Spawn enemies
        if (currentTime - this.lastEnemySpawn > this.enemySpawnInterval) {
            this.spawnEnemy();
            this.lastEnemySpawn = currentTime;
        }

        // Update and draw enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime);
            enemy.draw(this.ctx);

            // Enemy shooting
            if (enemy.shouldShoot()) {
                const bulletX = enemy.x + enemy.width / 2 - CONFIG.ENEMY_BULLET.WIDTH / 2;
                const bulletY = enemy.y + enemy.height;
                this.bullets.push(new Bullet(bulletX, bulletY, false));
            }

            // Remove if off screen or destroyed
            if (enemy.isOffScreen(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT) || !enemy.active) {
                // Check if player let enemy pass
                if (enemy.y > CONFIG.CANVAS_HEIGHT && enemy.active) {
                    this.player.takeDamage(5);
                    this.updateUI();
                }
                this.enemies.splice(i, 1);
            }
        }

        // Update and draw bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(deltaTime);
            bullet.draw(this.ctx);

            if (!bullet.active) {
                this.bullets.splice(i, 1);
            }
        }

        // Update and draw power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.update(deltaTime);
            powerUp.draw(this.ctx);

            if (!powerUp.active) {
                this.powerUps.splice(i, 1);
            }
        }

        // Update and draw effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.update(deltaTime);
            effect.draw(this.ctx);

            if (!effect.active) {
                this.effects.splice(i, 1);
            }
        }

        // Check collisions
        this.checkCollisions();

        // Check game over
        if (this.player && !this.player.active) {
            this.gameOver();
        }

        // Continue game loop
        requestAnimationFrame(this.update);
    }

    handlePlayerMovement() {
        if (!this.player) return;

        this.player.vx = 0;
        this.player.vy = 0;

        // Keyboard controls
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.player.vx = -this.player.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.player.vx = this.player.speed;
        }
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            this.player.vy = -this.player.speed;
        }
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            this.player.vy = this.player.speed;
        }

        // Touch controls - horizontal movement only
        if (this.touchControls.isActive) {
            const targetX = this.touchControls.currentX;
            const playerCenterX = this.player.x + this.player.width / 2;
            
            const dx = targetX - playerCenterX;
            const distance = Math.abs(dx);
            
            if (distance > 10) { // Dead zone to prevent jittery movement
                const moveSpeed = this.player.speed * 1.5; // Smooth touch movement
                if (dx > 0) {
                    this.player.vx = Math.min(moveSpeed, distance / 5); // Slow down as we approach target
                } else {
                    this.player.vx = Math.max(-moveSpeed, dx / 5);
                }
            }
        }
    }

    checkCollisions() {
        // Player bullets vs enemies
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (!bullet.isPlayer) continue;

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (checkCollision(bullet, enemy)) {
                    // Damage enemy
                    const destroyed = enemy.takeDamage(bullet.damage);
                    bullet.destroy();

                    if (destroyed) {
                        // Add score
                        this.addScore(enemy.points);
                        
                        // Create explosion
                        this.effects.push(new ExplosionEffect(
                            enemy.x + enemy.width / 2,
                            enemy.y + enemy.height / 2,
                            '#FFD700'
                        ));
                        
                        // Show points
                        this.effects.push(new TextEffect(
                            enemy.x + enemy.width / 2,
                            enemy.y,
                            `+${enemy.points}`,
                            '#FFD700'
                        ));
                        
                        // Spawn power-up
                        this.spawnPowerUp(enemy.x, enemy.y);
                    }
                    
                    break;
                }
            }
        }

        // Enemy bullets vs player
        if (this.player) {
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const bullet = this.bullets[i];
                if (bullet.isPlayer) continue;

                if (checkCollision(bullet, this.player)) {
                    const killed = this.player.takeDamage(bullet.damage);
                    bullet.destroy();
                    this.updateUI();
                    
                    if (!killed) {
                        shakeScreen(5, 200);
                    }
                }
            }

            // Player vs power-ups
            for (let i = this.powerUps.length - 1; i >= 0; i--) {
                const powerUp = this.powerUps[i];
                
                if (checkCollision(this.player, powerUp)) {
                    powerUp.applyEffect(this.player);
                    powerUp.destroy();
                    this.updateUI();
                    
                    // Show power-up text
                    this.effects.push(new TextEffect(
                        powerUp.x + powerUp.width / 2,
                        powerUp.y,
                        powerUp.config.emoji,
                        powerUp.config.color
                    ));
                }
            }

            // Player vs enemies (collision)
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                
                if (checkCollision(this.player, enemy)) {
                    const killed = this.player.takeDamage(20);
                    enemy.destroy();
                    this.updateUI();
                    
                    this.effects.push(new ExplosionEffect(
                        enemy.x + enemy.width / 2,
                        enemy.y + enemy.height / 2,
                        '#FF4444'
                    ));
                    
                    if (!killed) {
                        shakeScreen(8, 300);
                    }
                }
            }
        }
    }

    drawBackground() {
        // Draw starfield
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > CONFIG.CANVAS_HEIGHT) {
                star.y = 0;
                star.x = Math.random() * CONFIG.CANVAS_WIDTH;
            }

            star.brightness += Math.random() * 0.1 - 0.05;
            star.brightness = Math.max(0.3, Math.min(1, star.brightness));

            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    addScore(points) {
        this.score += Math.floor(points * this.level * CONFIG.LEVELS.SCORE_MULTIPLIER);
        this.updateUI();
        this.checkLevelUp();
    }

    checkLevelUp() {
        const newLevel = Math.floor(this.score / 500) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.enemySpawnInterval = Math.max(
                CONFIG.ENEMY.MIN_SPAWN_INTERVAL,
                CONFIG.ENEMY.SPAWN_INTERVAL - (this.level - 1) * CONFIG.LEVELS.SPAWN_RATE_DECREASE
            );
            
            // Show level up message
            this.effects.push(new TextEffect(
                CONFIG.CANVAS_WIDTH / 2,
                CONFIG.CANVAS_HEIGHT / 2,
                `레벨 ${this.level}!`,
                '#4ECDC4'
            ));
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        
        if (this.player) {
            const healthPercent = this.player.getHealthPercentage();
            document.getElementById('health-fill').style.width = `${healthPercent}%`;
        }
    }

    gameOver() {
        this.stop();
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-level').textContent = this.level;
        
        // Show game over screen
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('gameover-screen').classList.add('active');
    }
}

