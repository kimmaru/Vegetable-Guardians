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
        
        // Experience system
        this.experience = 0;
        this.experienceToNextLevel = 100;
        this.playerLevel = 1;

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
        this.experience = 0;
        this.experienceToNextLevel = 100;
        this.playerLevel = 1;
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
        // Scale touch position to match canvas internal coordinates
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
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
        // Scale touch position to match canvas internal coordinates
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
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

        if (this.player.powerUps.pentaShot) {
            // Shoot five bullets
            this.bullets.push(new Bullet(bulletX - 30, bulletY, true));
            this.bullets.push(new Bullet(bulletX - 15, bulletY, true));
            this.bullets.push(new Bullet(bulletX, bulletY, true));
            this.bullets.push(new Bullet(bulletX + 15, bulletY, true));
            this.bullets.push(new Bullet(bulletX + 30, bulletY, true));
        } else if (this.player.powerUps.quadShot) {
            // Shoot four bullets
            this.bullets.push(new Bullet(bulletX - 22, bulletY, true));
            this.bullets.push(new Bullet(bulletX - 7, bulletY, true));
            this.bullets.push(new Bullet(bulletX + 7, bulletY, true));
            this.bullets.push(new Bullet(bulletX + 22, bulletY, true));
        } else if (this.player.powerUps.tripleShot) {
            // Shoot three bullets
            this.bullets.push(new Bullet(bulletX - 15, bulletY, true));
            this.bullets.push(new Bullet(bulletX, bulletY, true));
            this.bullets.push(new Bullet(bulletX + 15, bulletY, true));
        } else if (this.player.powerUps.doubleShot) {
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
        
        this.enemies.push(new Enemy(x, y, speed, this.level));
        
        // Spawn additional enemies based on level (3x more, max 9 at once)
        const additionalEnemies = Math.min(Math.floor(this.level / 2) * 3, 8);
        for (let i = 0; i < additionalEnemies; i++) {
            const offsetX = randomInt(0, CONFIG.CANVAS_WIDTH - CONFIG.ENEMY.WIDTH);
            const offsetY = -CONFIG.ENEMY.HEIGHT - Math.floor((i + 1) / 3) * 60;
            this.enemies.push(new Enemy(offsetX, offsetY, speed, this.level));
        }
    }

    spawnPowerUp(x, y) {
        if (Math.random() > CONFIG.POWERUP.SPAWN_CHANCE) return;

        const types = Object.keys(CONFIG.POWERUP.TYPES);
        const type = randomChoice(types);
        
        this.powerUps.push(new PowerUp(x, y, type));
    }

    createExplosion(x, y) {
        // Damage nearby enemies
        const explosionRadius = 80;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dx = (enemy.x + enemy.width / 2) - x;
            const dy = (enemy.y + enemy.height / 2) - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < explosionRadius) {
                enemy.takeDamage(30);
                this.effects.push(new TextEffect(
                    enemy.x + enemy.width / 2,
                    enemy.y - 10,
                    '30',
                    '#FF4444'
                ));
            }
        }
        
        // Visual effect
        this.effects.push(new ExplosionEffect(x, y, '#FF6B00'));
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
        
        // Auto shooting - simplified to just shoot when ready
        if (this.autoShoot && this.player) {
            this.shoot();
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
            
            // Direct position update for immediate response
            if (distance > 5) { // Small dead zone
                // Move player directly to touch position (with bounds checking)
                const newX = targetX - this.player.width / 2;
                this.player.x = Math.max(0, Math.min(newX, CONFIG.CANVAS_WIDTH - this.player.width));
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
                    // Calculate damage (with critical hit)
                    let damage = bullet.damage;
                    let isCrit = false;
                    if (this.player && this.player.powerUps.criticalHit && Math.random() < 0.2) {
                        damage *= 2;
                        isCrit = true;
                    }
                    
                    // Damage enemy
                    const destroyed = enemy.takeDamage(damage);
                    
                    // Show damage number
                    this.effects.push(new TextEffect(
                        enemy.x + enemy.width / 2,
                        enemy.y - 10,
                        isCrit ? `${damage}!` : `${damage}`,
                        isCrit ? '#FF6B00' : '#FFFFFF'
                    ));
                    
                    // Vampire effect
                    if (this.player && this.player.powerUps.vampire) {
                        this.player.heal(Math.floor(damage * 0.1));
                        this.updateUI();
                    }
                    
                    // Piercing bullets don't get destroyed
                    if (!this.player || !this.player.powerUps.piercing) {
                        bullet.destroy();
                    }

                    if (destroyed) {
                        // Add score
                        this.addScore(enemy.points);
                        
                        // Add experience
                        this.addExperience(10);
                        
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
                        
                        // Explosive effect
                        if (this.player && this.player.powerUps.explosive) {
                            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                        }
                        
                        // Spawn power-up
                        this.spawnPowerUp(enemy.x, enemy.y);
                    }
                    
                    if (!this.player || !this.player.powerUps.piercing) {
                        break;
                    }
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

    addExperience(amount) {
        this.experience += amount;
        this.updateUI();
        
        // Check for level up
        if (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.playerLevel++;
        this.experience -= this.experienceToNextLevel;
        this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.2); // Changed from 1.5 to 1.2
        
        // Pause game and show ability selection
        this.isPaused = true;
        this.showAbilitySelection();
        
        // Show level up message
        this.effects.push(new TextEffect(
            CONFIG.CANVAS_WIDTH / 2,
            CONFIG.CANVAS_HEIGHT / 2,
            `레벨 업! Lv.${this.playerLevel}`,
            '#FFD700'
        ));
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
                `웨이브 ${this.level}!`,
                '#4ECDC4'
            ));
        }
    }

    showAbilitySelection() {
        const abilityOverlay = document.getElementById('ability-overlay');
        const abilityChoices = document.getElementById('ability-choices');
        
        // Define available abilities with rarity
        const abilities = [
            // SSS Tier (0.5% chance)
            { 
                id: 'godMode', 
                tier: 'SSS',
                name: '👑 절대 방어', 
                description: '5초간 무적 상태 (재사용 60초)',
                effect: () => {
                    this.player.powerUps.godMode = true;
                }
            },
            { 
                id: 'timeSlow', 
                tier: 'SSS',
                name: '⏰ 시간 왜곡', 
                description: '적 속도 70% 감소',
                effect: () => {
                    this.player.powerUps.timeSlow = true;
                }
            },
            // SS Tier (2% chance)
            { 
                id: 'pentaShot', 
                tier: 'SS',
                name: '🌟 펜타샷', 
                description: '5발 동시 발사',
                effect: () => {
                    this.player.powerUps.pentaShot = true;
                }
            },
            { 
                id: 'orbital', 
                tier: 'SS',
                name: '🛸 궤도 위성', 
                description: '3개의 위성이 주위를 공격',
                effect: () => {
                    this.player.powerUps.orbital = true;
                }
            },
            { 
                id: 'megaExplosion', 
                tier: 'SS',
                name: '💥 메가 폭발', 
                description: '폭발 범위 +100%, 데미지 +50',
                effect: () => {
                    this.player.powerUps.megaExplosion = true;
                }
            },
            // S Tier (5% chance)
            { 
                id: 'quadShot', 
                tier: 'S',
                name: '🎯 쿼드샷', 
                description: '4발 동시 발사',
                effect: () => {
                    this.player.powerUps.quadShot = true;
                }
            },
            { 
                id: 'laserBeam', 
                tier: 'S',
                name: '🔆 레이저 빔', 
                description: '관통 레이저 발사',
                effect: () => {
                    this.player.powerUps.laserBeam = true;
                }
            },
            { 
                id: 'homingMissile', 
                tier: 'S',
                name: '🚀 유도 미사일', 
                description: '적을 추적하는 미사일',
                effect: () => {
                    this.player.powerUps.homingMissile = true;
                }
            },
            { 
                id: 'chainLightning', 
                tier: 'S',
                name: '⚡ 연쇄 번개', 
                description: '적에서 적으로 튕기는 번개',
                effect: () => {
                    this.player.powerUps.chainLightning = true;
                }
            },
            // A Tier (10% chance)
            { 
                id: 'tripleShot', 
                tier: 'A',
                name: '🎯 트리플샷', 
                description: '3발 동시 발사',
                effect: () => {
                    this.player.powerUps.tripleShot = true;
                }
            },
            { 
                id: 'piercing', 
                tier: 'A',
                name: '🔥 관통 탄환', 
                description: '총알이 3명까지 관통',
                effect: () => {
                    this.player.powerUps.piercing = true;
                    this.player.piercingCount = 3;
                }
            },
            { 
                id: 'explosive', 
                tier: 'A',
                name: '💣 폭발 탄환', 
                description: '적 처치시 광역 데미지',
                effect: () => {
                    this.player.powerUps.explosive = true;
                }
            },
            { 
                id: 'multiShot', 
                tier: 'A',
                name: '🔫 멀티샷', 
                description: '발사 횟수 +1',
                effect: () => {
                    this.player.multiShotCount = (this.player.multiShotCount || 1) + 1;
                }
            },
            { 
                id: 'drone', 
                tier: 'A',
                name: '🤖 전투 드론', 
                description: '자동 공격 드론 소환',
                effect: () => {
                    this.player.droneCount = (this.player.droneCount || 0) + 1;
                }
            },
            // B Tier (20% chance)
            { 
                id: 'damageUp2', 
                tier: 'B',
                name: '⚔️ 공격력 강화', 
                description: '공격력 +20',
                effect: () => {
                    CONFIG.BULLET.DAMAGE += 20;
                }
            },
            { 
                id: 'fireRateUp2', 
                tier: 'B',
                name: '⚡ 연사 강화', 
                description: '발사 속도 +30%',
                effect: () => {
                    this.player.shootCooldown = Math.max(100, this.player.shootCooldown * 0.7);
                }
            },
            { 
                id: 'bulletSize', 
                tier: 'B',
                name: '💥 대형 탄환', 
                description: '총알 크기 +40%',
                effect: () => {
                    CONFIG.BULLET.WIDTH *= 1.4;
                    CONFIG.BULLET.HEIGHT *= 1.4;
                }
            },
            { 
                id: 'criticalHit', 
                tier: 'B',
                name: '✨ 치명타', 
                description: '25% 확률로 2.5배 데미지',
                effect: () => {
                    this.player.powerUps.criticalHit = true;
                    this.player.critChance = 0.25;
                    this.player.critMultiplier = 2.5;
                }
            },
            { 
                id: 'boomerang', 
                tier: 'B',
                name: '🪃 부메랑', 
                description: '돌아오는 부메랑 발사',
                effect: () => {
                    this.player.powerUps.boomerang = true;
                }
            },
            // C Tier (30% chance)
            { 
                id: 'damageUp', 
                tier: 'C',
                name: '⚔️ 공격력 증가', 
                description: '공격력 +12',
                effect: () => {
                    CONFIG.BULLET.DAMAGE += 12;
                }
            },
            { 
                id: 'fireRateUp', 
                tier: 'C',
                name: '⚡ 연사 증가', 
                description: '발사 속도 +20%',
                effect: () => {
                    this.player.shootCooldown = Math.max(100, this.player.shootCooldown * 0.8);
                }
            },
            { 
                id: 'bulletSpeed', 
                tier: 'C',
                name: '💨 탄환 가속', 
                description: '총알 속도 +30%',
                effect: () => {
                    CONFIG.BULLET.SPEED *= 1.3;
                }
            },
            { 
                id: 'freezing', 
                tier: 'C',
                name: '❄️ 냉동 탄환', 
                description: '적 속도 40% 감소',
                effect: () => {
                    this.player.powerUps.freezing = true;
                }
            },
            // D Tier (32.5% chance)
            { 
                id: 'damageUpSmall', 
                tier: 'D',
                name: '⚔️ 공격력 소폭 증가', 
                description: '공격력 +8',
                effect: () => {
                    CONFIG.BULLET.DAMAGE += 8;
                }
            },
            { 
                id: 'fireRateUpSmall', 
                tier: 'D',
                name: '⚡ 연사 소폭 증가', 
                description: '발사 속도 +15%',
                effect: () => {
                    this.player.shootCooldown = Math.max(100, this.player.shootCooldown * 0.85);
                }
            },
            { 
                id: 'regen', 
                tier: 'D',
                name: '❤️‍🩹 체력 재생', 
                description: '초당 체력 +2',
                effect: () => {
                    this.player.powerUps.regen = true;
                    this.player.regenAmount = 2;
                }
            },
            { 
                id: 'magnetism', 
                tier: 'D',
                name: '🧲 자석', 
                description: '파워업 흡수 범위 증가',
                effect: () => {
                    this.player.powerUps.magnetism = true;
                }
            }
        ];
        
        // Tier weights for rarity
        const tierWeights = {
            'SSS': 0.5,
            'SS': 2,
            'S': 5,
            'A': 10,
            'B': 20,
            'C': 30,
            'D': 32.5
        };
        
        // Select 3 abilities based on weighted random
        const selectedAbilities = [];
        for (let i = 0; i < 3; i++) {
            const roll = Math.random() * 100;
            let cumulative = 0;
            let selectedTier = 'D';
            
            for (const [tier, weight] of Object.entries(tierWeights)) {
                cumulative += weight;
                if (roll < cumulative) {
                    selectedTier = tier;
                    break;
                }
            }
            
            // Filter abilities by selected tier
            const tierAbilities = abilities.filter(a => a.tier === selectedTier);
            if (tierAbilities.length > 0) {
                const randomAbility = tierAbilities[Math.floor(Math.random() * tierAbilities.length)];
                selectedAbilities.push(randomAbility);
            }
        }
        
        // Tier colors
        const tierColors = {
            'SSS': '#FF0066',
            'SS': '#FF6B00',
            'S': '#FFD700',
            'A': '#00FF88',
            'B': '#00CCFF',
            'C': '#9370DB',
            'D': '#A0A0A0'
        };
        
        // Create ability buttons
        abilityChoices.innerHTML = '';
        selectedAbilities.forEach(ability => {
            const button = document.createElement('button');
            button.className = `ability-button tier-${ability.tier}`;
            button.style.borderColor = tierColors[ability.tier];
            button.innerHTML = `
                <div class="ability-tier" style="color: ${tierColors[ability.tier]}">[${ability.tier}]</div>
                <div class="ability-name">${ability.name}</div>
                <div class="ability-description">${ability.description}</div>
            `;
            button.addEventListener('click', () => {
                ability.effect();
                this.hideAbilitySelection();
                this.isPaused = false;
                this.updateUI();
            });
            abilityChoices.appendChild(button);
        });
        
        abilityOverlay.classList.remove('hidden');
    }

    hideAbilitySelection() {
        const abilityOverlay = document.getElementById('ability-overlay');
        abilityOverlay.classList.add('hidden');
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        
        // Update experience bar
        const expPercent = (this.experience / this.experienceToNextLevel) * 100;
        const expFill = document.getElementById('exp-fill');
        if (expFill) {
            expFill.style.width = `${expPercent}%`;
        }
        
        // Update player level display
        const playerLevelEl = document.getElementById('player-level');
        if (playerLevelEl) {
            playerLevelEl.textContent = this.playerLevel;
        }
        
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

