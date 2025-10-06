// Game Configuration
export const CONFIG = {
    // Canvas settings
    CANVAS_WIDTH: 900,
    CANVAS_HEIGHT: 700,
    
    // Player settings
    PLAYER: {
        WIDTH: 50,
        HEIGHT: 50,
        SPEED: 3, // Reduced from 6 to 3 (50% slower)
        MAX_HEALTH: 100,
        SHOOT_COOLDOWN: 1050, // Increased to 1050ms (3x slower)
        COLOR: '#4CAF50',
    },
    
    // Enemy settings
    ENEMY: {
        WIDTH: 40,
        HEIGHT: 40,
        BASE_SPEED: 0.3, // Reduced from 0.6 to 0.3 (50% slower again)
        BASE_HEALTH: 50, // Increased from 25 to 50 (2x health)
        SPAWN_INTERVAL: 3000, // Increased from 2000 to 3000ms
        MIN_SPAWN_INTERVAL: 1200, // Increased from 800 to 1200ms
        POINTS: 10,
    },
    
    // Boss settings
    BOSS: {
        WIDTH: 100,
        HEIGHT: 100,
        SPEED: 0.5,
        BASE_HEALTH: 500,
        SPAWN_SCORE: 1000, // Boss appears every 1000 points
        POINTS: 100,
    },
    
    // Bullet settings
    BULLET: {
        WIDTH: 6,
        HEIGHT: 15,
        SPEED: 5, // Reduced from 10 to 5 (50% slower)
        COLOR: '#FFD700',
        DAMAGE: 25,
    },
    
    // Enemy bullet settings
    ENEMY_BULLET: {
        WIDTH: 5,
        HEIGHT: 12,
        SPEED: 2.5, // Reduced from 5 to 2.5 (50% slower)
        COLOR: '#FF4444',
        DAMAGE: 10,
    },
    
    // Power-up settings
    POWERUP: {
        WIDTH: 30,
        HEIGHT: 30,
        SPEED: 1.5, // Reduced from 3 to 1.5 (50% slower)
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
        ENEMY_SPEED_INCREASE: 0.15, // Reduced from 0.3 to 0.15 for more gradual difficulty increase
        SPAWN_RATE_DECREASE: 150, // Reduced from 200 for more gradual spawn rate increase
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
    BOSSES: ['👹', '🐉', '🦖', '👺', '😈', '🦑'],
    EXPLOSIONS: ['💥', '✨', '💫', '⭐', '🌟'],
};

