// Game Configuration
export const CONFIG = {
    // Canvas settings
    CANVAS_WIDTH: 900,
    CANVAS_HEIGHT: 700,
    
    // Player settings
    PLAYER: {
        WIDTH: 50,
        HEIGHT: 50,
        SPEED: 6,
        MAX_HEALTH: 100,
        SHOOT_COOLDOWN: 250, // milliseconds
        COLOR: '#4CAF50',
    },
    
    // Enemy settings
    ENEMY: {
        WIDTH: 40,
        HEIGHT: 40,
        BASE_SPEED: 2,
        SPAWN_INTERVAL: 2000, // milliseconds
        MIN_SPAWN_INTERVAL: 500,
        POINTS: 10,
    },
    
    // Bullet settings
    BULLET: {
        WIDTH: 6,
        HEIGHT: 15,
        SPEED: 10,
        COLOR: '#FFD700',
        DAMAGE: 25,
    },
    
    // Enemy bullet settings
    ENEMY_BULLET: {
        WIDTH: 5,
        HEIGHT: 12,
        SPEED: 5,
        COLOR: '#FF4444',
        DAMAGE: 10,
    },
    
    // Power-up settings
    POWERUP: {
        WIDTH: 30,
        HEIGHT: 30,
        SPEED: 3,
        SPAWN_CHANCE: 0.15, // 15% chance on enemy kill
        DURATION: 10000, // 10 seconds
        TYPES: {
            HEALTH: { color: '#FF6B6B', emoji: '❤️', effect: 'health' },
            RAPID_FIRE: { color: '#4ECDC4', emoji: '⚡', effect: 'rapidFire' },
            SHIELD: { color: '#95E1D3', emoji: '🛡️', effect: 'shield' },
            DOUBLE_SHOT: { color: '#F38181', emoji: '✨', effect: 'doubleShot' },
        }
    },
    
    // Level progression
    LEVELS: {
        SCORE_MULTIPLIER: 1.2,
        ENEMY_SPEED_INCREASE: 0.3,
        SPAWN_RATE_DECREASE: 200,
    },
    
    // Particle effects
    PARTICLES: {
        COUNT: 15,
        SIZE: 3,
        SPEED: 2,
        LIFETIME: 500,
    },
};

// Emoji sets for game objects
export const EMOJIS = {
    PLAYER: ['🥕', '🌽', '🥬', '🥦', '🥒'],
    ENEMIES: ['👾', '👻', '🦠', '💀', '🐛'],
    EXPLOSIONS: ['💥', '✨', '💫', '⭐', '🌟'],
};

