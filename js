// ============================================================
// BULLET TIME — FULL GAME JAVASCRIPT
// ============================================================

// ============================================================
// 0. КАСТОМНЫЕ ССЫЛКИ НА АССЕТЫ (Картинки и Музыка)
// ============================================================
const USER_ASSETS = {
    PLAYER: 'player.png',         // Размер: 64x64 px. Вид сверху, смотрит ВПРАВО
    ENEMY_CHASER: '',   // Размер: 64x64 px. Вид сверху, смотрит ВПРАВО
    ENEMY_RUNNER: '',   // Размер: 64x64 px. Вид сверху, смотрит ВПРАВО
    ENEMY_SHOOTER: '',  // Размер: 64x64 px. Вид сверху, смотрит ВПРАВО
    ENEMY_TANK: '',     // Размер: 128x128 px. Вид сверху, смотрит ВПРАВО
    ARENA_FLOOR: '',    // Размер: 1280x720 px. Поверхность арены
    OBSTACLE: '',       // Размер: 120x60 px. Препятствие
    UPGRADE_CARD_BG: '' // Размер: 220x260 px. Ффон карточки улучшений
};

const AUDIO_CONFIG = {
    musicUrl: "https://www.dropbox.com/scl/fi/t7ol4ogkaft4c9dfk4apn/Endless-Hordes.mp3?rlkey=6pdbrwic9twgigrsrtetst93z&raw=1",
    shootUrl: "",
    hitUrl: "",
    enemyDeathUrl: "",
    playerDamageUrl: "",
    dashUrl: "",
    bulletTimeStartUrl: "",
    levelUpUrl: "",
    gameOverUrl: "",
    musicVolume: 0.35,
    sfxVolume: 0.70
};

// ============================================================
// 1. ASSET MANAGER
// ============================================================
class AssetManager {
    constructor() {
        this.images = {};
    }

    loadAll(urls) {
        for (let key in urls) {
            const url = urls[key];
            if (url && typeof url === 'string' && url.trim() !== '') {
                const img = new Image();
                if (/^https?:/i.test(url.trim())) img.crossOrigin = 'Anonymous';
                img.src = url.trim();
                this.images[key] = img;
            }
        }
    }

    isLoaded(key) {
        const img = this.images[key];
        return img && img.complete && img.naturalWidth !== 0;
    }

    get(key) {
        return this.isLoaded(key) ? this.images[key] : null;
    }
}

// ============================================================
// 2. AUDIO SYSTEM
// ============================================================
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.music = null;
        this.musicPlaying = false;
        this.musicVolume = AUDIO_CONFIG.musicVolume;
        this.sfxVolume = AUDIO_CONFIG.sfxVolume;

        this.shootPool = [];
        this.shootPoolIndex = 0;

        if (AUDIO_CONFIG.shootUrl) {
            for (let i = 0; i < 6; i++) {
                const sound = new Audio(AUDIO_CONFIG.shootUrl);
                sound.volume = this.sfxVolume;
                sound.preload = "auto";
                this.shootPool.push(sound);
            }
        }
    }

    init() {
        if (!this.audioContext) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.audioContext = new AudioCtx();
            }
        }
        if (this.audioContext && this.audioContext.state === "suspended") {
            this.audioContext.resume();
        }
    }

    startMusic() {
        if (!AUDIO_CONFIG.musicUrl) return;

        if (!this.music) {
            this.music = new Audio(AUDIO_CONFIG.musicUrl);
            this.music.loop = true;
            this.music.volume = this.musicVolume;
            this.music.preload = "auto";
        }

        this.music.volume = this.musicVolume;
        this.music.play()
            .then(() => {
                this.musicPlaying = true;
            })
            .catch((err) => {
                console.warn("Автовоспроизведение музыки заблокировано браузером:", err);
            });
    }

    stopMusic() {
        if (!this.music) return;
        this.music.pause();
        this.music.currentTime = 0;
        this.musicPlaying = false;
    }

    playUrl(url, volume = this.sfxVolume) {
        if (!url) return false;
        const sound = new Audio(url);
        sound.volume = volume;
        sound.preload = "auto";
        sound.play().catch(() => {});
        return true;
    }

    shoot() {
        if (AUDIO_CONFIG.shootUrl) {
            if (this.shootPool.length > 0) {
                const sound = this.shootPool[this.shootPoolIndex];
                sound.currentTime = 0;
                sound.volume = this.sfxVolume;
                sound.play().catch(() => {});
                this.shootPoolIndex = (this.shootPoolIndex + 1) % this.shootPool.length;
            } else {
                this.playUrl(AUDIO_CONFIG.shootUrl);
            }
            return;
        }
        this.synthShoot();
    }

    hit() {
        if (AUDIO_CONFIG.hitUrl) { this.playUrl(AUDIO_CONFIG.hitUrl); } else { this.synthHit(); }
    }

    enemyDeath() {
        if (AUDIO_CONFIG.enemyDeathUrl) { this.playUrl(AUDIO_CONFIG.enemyDeathUrl); } else { this.synthDeath(); }
    }

    playerDamage() {
        if (AUDIO_CONFIG.playerDamageUrl) { this.playUrl(AUDIO_CONFIG.playerDamageUrl); } else { this.synthDamage(); }
    }

    dash() {
        if (AUDIO_CONFIG.dashUrl) { this.playUrl(AUDIO_CONFIG.dashUrl); } else { this.synthDash(); }
    }

    bulletTimeStart() {
        if (AUDIO_CONFIG.bulletTimeStartUrl) { this.playUrl(AUDIO_CONFIG.bulletTimeStartUrl); } else { this.synthBulletTime(); }
    }

    levelUp() {
        if (AUDIO_CONFIG.levelUpUrl) { this.playUrl(AUDIO_CONFIG.levelUpUrl); } else { this.synthLevelUp(); }
    }

    gameOver() {
        if (AUDIO_CONFIG.gameOverUrl) { this.playUrl(AUDIO_CONFIG.gameOverUrl); } else { this.synthGameOver(); }
        this.stopMusic();
    }

    synthShoot() {
        this.init();
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(180, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, this.audioContext.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.08);
    }

    synthHit() {
        this.init();
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(500, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.audioContext.currentTime + 0.12);
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.12);
    }

    synthDeath() {
        this.init();
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.25);
    }

    synthDamage() {
        this.init();
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(45, this.audioContext.currentTime + 0.2);
        gain.gain.setValueAtTime(0.18, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);
    }

    synthDash() {
        this.init();
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, this.audioContext.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
    }

    synthBulletTime() {
        this.init();
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, this.audioContext.currentTime + 0.35);
        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.35);
    }

    synthLevelUp() {
        this.init();
        if (!this.audioContext) return;
        const notes = [440, 660, 880];
        notes.forEach((frequency, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const time = this.audioContext.currentTime + index * 0.12;
            osc.type = "sine";
            osc.frequency.setValueAtTime(frequency, time);
            gain.gain.setValueAtTime(0.12, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start(time);
            osc.stop(time + 0.25);
        });
    }

    synthGameOver() {
        this.init();
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 1);
        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 1);
    }
}

// ============================================================
// 3. INPUT HANDLER
// ============================================================
class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouse = { x: 640, y: 360, down: false };

        window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = 1280 / rect.width;
            const scaleY = 720 / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
        });
        window.addEventListener('mousedown', (e) => { if (e.button === 0) this.mouse.down = true; });
        window.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouse.down = false; });
    }
    isPressed(code) { return !!this.keys[code]; }
}

// ============================================================
// 4. PARTICLES
// ============================================================
class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.color = color; this.size = size; this.life = life; this.maxLife = life;
    }
    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() { this.particles = []; }
    spawn(x, y, color, count = 8, speedScale = 1, sizeRange = [2, 4], lifeRange = [0.2, 0.5]) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 150 + 50) * speedScale;
            this.particles.push(new Particle(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed, color, 
                sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]), 
                lifeRange[0] + Math.random() * (lifeRange[1] - lifeRange[0])));
        }
    }
    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }
    }
    draw(ctx) { this.particles.forEach(p => p.draw(ctx)); }
    clear() { this.particles = []; }
}

// ============================================================
// 5. OBSTACLES & ARENA
// ============================================================
class Obstacle {
    constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
    draw(ctx, game) {
        ctx.save();
        const obsImg = game.assets.get('OBSTACLE');
        if (obsImg) {
            ctx.drawImage(obsImg, this.x, this.y, this.w, this.h);
        } else {
            ctx.fillStyle = '#0a0e17';
            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 10;
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        }
        ctx.restore();
    }
}

// ============================================================
// 6. PLAYER
// ============================================================
class Player {
    constructor(x, y) {
        this.x = x; this.y = y; this.radius = 18; this.angle = 0;
        this.baseSpeed = 260; this.speed = this.baseSpeed;
        this.maxHp = 100; this.hp = this.maxHp;
        this.damage = 25; this.fireRate = 0.18; this.shootCooldown = 0;
        this.bulletSpeed = 900; this.critChance = 0.05;
        this.maxEnergy = 100; this.energy = this.maxEnergy;
        this.energyDrainRate = 35; this.energyRegenRate = 12;
        this.dashCooldown = 0; this.isDashing = false; this.dashTimer = 0;
        this.invulnTimer = 0; this.level = 1; this.xp = 0; this.nextLevelXp = 100;
    }
    reset(x, y) {
        this.x = x; this.y = y; this.maxHp = 100; this.hp = this.maxHp;
        this.damage = 25; this.fireRate = 0.18; this.speed = this.baseSpeed;
        this.maxEnergy = 100; this.energy = this.maxEnergy; this.bulletSpeed = 900;
        this.critChance = 0.05; this.level = 1; this.xp = 0; this.nextLevelXp = 100;
        this.invulnTimer = 0; this.dashCooldown = 0; this.shootCooldown = 0;
        this.isDashing = false; this.dashTimer = 0;
    }
    update(dt, realDt, input, game) {
        if (this.shootCooldown > 0) this.shootCooldown -= realDt;
        if (this.dashCooldown > 0) this.dashCooldown -= realDt;
        if (this.invulnTimer > 0) this.invulnTimer -= realDt;

        if (this.isDashing) {
            this.dashTimer -= realDt;
            if (this.dashTimer <= 0) this.isDashing = false;
        }

        this.angle = Math.atan2(input.mouse.y - this.y, input.mouse.x - this.x);

        let moveX = 0, moveY = 0;
        if (input.isPressed('KeyW') || input.isPressed('ArrowUp')) moveY -= 1;
        if (input.isPressed('KeyS') || input.isPressed('ArrowDown')) moveY += 1;
        if (input.isPressed('KeyA') || input.isPressed('ArrowLeft')) moveX -= 1;
        if (input.isPressed('KeyD') || input.isPressed('ArrowRight')) moveX += 1;

        if (moveX !== 0 || moveY !== 0) {
            const len = Math.hypot(moveX, moveY);
            moveX /= len; moveY /= len;
        }

        if (input.isPressed('ShiftLeft') && this.dashCooldown <= 0 && (moveX !== 0 || moveY !== 0)) {
            this.isDashing = true; this.dashTimer = 0.15; this.dashCooldown = 1.2;
            this.invulnTimer = 0.25; game.sound.dash();
            game.particles.spawn(this.x, this.y, '#00f3ff', 15, 1.5);
            game.addScreenShake(6);
        }

        const currentSpeed = this.isDashing ? this.speed * 3.2 : this.speed;
        const moveDt = game.isBulletTime ? realDt * 0.9 : realDt;
        let newX = this.x + moveX * currentSpeed * moveDt;
        let newY = this.y + moveY * currentSpeed * moveDt;

        newX = Math.max(this.radius + 20, Math.min(1280 - this.radius - 20, newX));
        newY = Math.max(this.radius + 20, Math.min(720 - this.radius - 20, newY));

        if (!this.checkObstacleCollision(newX, this.y, game.obstacles)) this.x = newX;
        if (!this.checkObstacleCollision(this.x, newY, game.obstacles)) this.y = newY;

        if (input.mouse.down && this.shootCooldown <= 0) {
            this.shoot(game);
            this.shootCooldown = this.fireRate;
        }
    }
    checkObstacleCollision(x, y, obstacles) {
        for (let obs of obstacles) {
            const cx = Math.max(obs.x, Math.min(x, obs.x + obs.w));
            const cy = Math.max(obs.y, Math.min(y, obs.y + obs.h));
            if ((x - cx) ** 2 + (y - cy) ** 2 < this.radius ** 2) return true;
        }
        return false;
    }
    shoot(game) {
        const isCrit = Math.random() < this.critChance;
        const dmg = isCrit ? this.damage * 2 : this.damage;
        const dx = Math.cos(this.angle), dy = Math.sin(this.angle);
        game.bullets.push(new PlayerBullet(this.x + dx * 20, this.y + dy * 20, dx, dy, this.bulletSpeed, dmg, isCrit));
        game.sound.shoot();
        game.addScreenShake(2);
    }
    takeDamage(amount, game) {
        if (this.invulnTimer > 0) return;
        this.hp -= amount; this.invulnTimer = 0.5;
        game.sound.playerDamage(); game.addScreenShake(12);
        game.particles.spawn(this.x, this.y, '#ff0055', 20, 1.5);
        if (this.hp <= 0) { this.hp = 0; game.gameOver(); }
    }
    addXp(amount, game) {
        this.xp += amount;
        if (this.xp >= this.nextLevelXp) {
            this.xp -= this.nextLevelXp; this.level++;
            this.nextLevelXp = Math.floor(this.nextLevelXp * 1.4);
            game.triggerLevelUp();
        }
    }
    draw(ctx, game) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (game.isBulletTime) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 12 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.6)'; ctx.lineWidth = 2;
            ctx.shadowColor = '#00f3ff'; ctx.shadowBlur = 15; ctx.stroke();
        }
        ctx.rotate(this.angle);
        if (this.invulnTimer > 0 && Math.floor(Date.now() / 50) % 2 === 0) ctx.globalAlpha = 0.5;

        const playerImg = game.assets.get('PLAYER');
        if (playerImg) {
            const size = this.radius * 3.8;
            ctx.shadowColor = 'rgba(0, 243, 255, 0.55)'; ctx.shadowBlur = 14;
            ctx.drawImage(playerImg, -size / 2, -size / 2, size, size);
        } else {
            ctx.fillStyle = '#05050a'; ctx.strokeStyle = '#00f3ff'; ctx.lineWidth = 2;
            ctx.shadowColor = '#00f3ff'; ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-12, -12); ctx.lineTo(-6, 0); ctx.lineTo(-12, 12); ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#00f3ff'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}

// ============================================================
// 7. BULLETS & ENEMIES
// ============================================================
class PlayerBullet {
    constructor(x, y, dx, dy, speed, damage, isCrit) {
        this.x = x; this.y = y; this.vx = dx * speed; this.vy = dy * speed;
        this.damage = damage; this.isCrit = isCrit; this.radius = isCrit ? 4 : 3; this.life = 1.8;
    }
    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; }
    draw(ctx) {
        ctx.save();
        const color = this.isCrit ? '#ffcc00' : '#00f3ff';
        ctx.strokeStyle = color; ctx.lineWidth = this.radius * 2; ctx.shadowColor = color; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x - this.vx * 0.03, this.y - this.vy * 0.03); ctx.stroke();
        ctx.restore();
    }
}

class EnemyBullet {
    constructor(x, y, dx, dy, speed, damage) {
        this.x = x; this.y = y; this.vx = dx * speed; this.vy = dy * speed;
        this.damage = damage; this.radius = 5; this.life = 4.0;
    }
    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; }
    draw(ctx) {
        ctx.save(); ctx.fillStyle = '#ff0055'; ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

class Enemy {
    constructor(x, y, type, waveScale = 1) {
        this.x = x; this.y = y; this.type = type; this.hitFlash = 0; this.angle = 0;
        if (type === 'RUNNER') {
            this.radius = 14; this.hp = 25 * waveScale; this.maxHp = this.hp; this.speed = 220; this.damage = 10; this.score = 120; this.xp = 20; this.bt = 7; this.color = '#ff00aa';
        } else if (type === 'SHOOTER') {
            this.radius = 16; this.hp = 50 * waveScale; this.maxHp = this.hp; this.speed = 120; this.damage = 15; this.score = 180; this.xp = 35; this.bt = 10; this.color = '#00e5ff';
            this.shootCooldown = 2.0; this.shootTimer = Math.random() * 1.5;
        } else if (type === 'TANK') {
            this.radius = 28; this.hp = 220 * waveScale; this.maxHp = this.hp; this.speed = 65; this.damage = 30; this.score = 350; this.xp = 80; this.bt = 15; this.color = '#ff3300';
        } else {
            this.radius = 15; this.hp = 45 * waveScale; this.maxHp = this.hp; this.speed = 140; this.damage = 15; this.score = 100; this.xp = 25; this.bt = 5; this.color = '#ffaa00';
        }
    }
    update(dt, player, game) {
        if (this.hitFlash > 0) this.hitFlash -= dt;
        const dx = player.x - this.x, dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        const dirX = dist > 0 ? dx / dist : 0, dirY = dist > 0 ? dy / dist : 0;
        this.angle = Math.atan2(dy, dx);

        if (this.type === 'SHOOTER') {
            if (dist < 280) { this.x -= dirX * this.speed * dt; this.y -= dirY * this.speed * dt; }
            else if (dist > 350) { this.x += dirX * this.speed * dt; this.y += dirY * this.speed * dt; }
            this.shootTimer += dt;
            if (this.shootTimer >= this.shootCooldown) {
                this.shootTimer = 0;
                game.enemyBullets.push(new EnemyBullet(this.x, this.y, dirX, dirY, 320, 12));
            }
        } else {
            this.x += dirX * this.speed * dt;
            this.y += dirY * this.speed * dt;
        }
        this.x = Math.max(this.radius + 20, Math.min(1280 - this.radius - 20, this.x));
        this.y = Math.max(this.radius + 20, Math.min(720 - this.radius - 20, this.y));
    }
    takeDamage(amount, game) {
        this.hp -= amount; this.hitFlash = 0.08; game.sound.hit();
        game.particles.spawn(this.x, this.y, this.color, 4, 0.6);
        if (this.hp <= 0) { game.onEnemyKilled(this); return true; }
        return false;
    }
    draw(ctx, game) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        const img = game.assets.get(`ENEMY_${this.type}`);
        if (img) {
            const size = this.radius * 2.4;
            if (this.hitFlash > 0) ctx.globalAlpha = 0.6;
            ctx.drawImage(img, -size / 2, -size / 2, size, size);
        } else {
            ctx.fillStyle = '#080810'; ctx.strokeStyle = this.hitFlash > 0 ? '#ffffff' : this.color; ctx.lineWidth = 2;
            ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.restore();
    }
}

// ============================================================
// 8. UPGRADES
// ============================================================
const UPGRADES_POOL = [
    { title: 'RAPID FIRE', desc: '+25% Скорострельности', apply: (p) => p.fireRate *= 0.78 },
    { title: 'POWER SHOT', desc: '+30% Урона пушек', apply: (p) => p.damage *= 1.30 },
    { title: 'OVERDRIVE', desc: '+20% Скорости бега', apply: (p) => p.speed *= 1.20 },
    { title: 'TIME CORE', desc: '+30 Макс. энергии Bullet Time', apply: (p) => { p.maxEnergy += 30; p.energy += 30; } },
    { title: 'TIME REACTOR', desc: '+50% Регенерации энергии', apply: (p) => p.energyRegenRate *= 1.50 },
    { title: 'REINFORCED CORE', desc: '+25 HP и лечение', apply: (p) => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); } },
    { title: 'BULLET SPEED', desc: '+25% Скорости пуль', apply: (p) => p.bulletSpeed *= 1.25 },
    { title: 'CRITICAL SHOT', desc: '+15% Шанса крита (x2)', apply: (p) => p.critChance += 0.15 }
];

// ============================================================
// 9. GAME ENGINE & START BUTTON FIX
// ============================================================
// Безопасная работа с localStorage (может быть заблокирован браузером)
const SafeStorage = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* игнорируем */ } }
};

class Game {
    constructor() {
        // Кнопки подключаем в первую очередь, чтобы старт работал при любых сбоях ниже
        this.setupEventListeners();

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.assets = new AssetManager();
        this.assets.loadAll(USER_ASSETS);

        this.sound = new SoundSystem();
        this.input = new InputHandler(this.canvas);
        this.particles = new ParticleSystem();

        this.state = 'START';
        this.timeScale = 1.0;
        this.isBulletTime = false;

        this.player = new Player(640, 360);
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.obstacles = [
            new Obstacle(280, 180, 120, 60), new Obstacle(880, 180, 120, 60),
            new Obstacle(280, 480, 120, 60), new Obstacle(880, 480, 120, 60)
        ];

        this.score = 0; this.kills = 0; this.combo = 1; this.maxCombo = 1; this.comboTimer = 0;
        this.wave = 1; this.enemiesToSpawn = []; this.spawnTimer = 0;
        this.highScore = parseInt(SafeStorage.get('bullet_time_highscore')) || 0;
        this.screenShake = 0;

        document.getElementById('start-best-score').textContent = this.highScore;

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    setupEventListeners() {
        // КНОПКА СТАРТ ТЕПЕРЬ РАБОТАЕТ КОРРЕКТНО
        document.getElementById('btn-start').addEventListener('click', () => {
            try { this.sound.init(); this.sound.startMusic(); } catch (e) { console.warn('Аудио недоступно:', e); }
            this.startNewGame();
        });

        document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
        document.getElementById('btn-restart').addEventListener('click', () => this.startNewGame());
    }

    startNewGame() {
        this.score = 0; this.kills = 0; this.combo = 1; this.maxCombo = 1; this.wave = 1;
        this.bullets = []; this.enemyBullets = []; this.enemies = []; this.particles.clear();
        this.player.reset(640, 360);
        this.comboTimer = 0; this.spawnTimer = 0; this.screenShake = 0;
        this.isBulletTime = false; this.timeScale = 1.0;
        this.startWave(1);
        this.setOverlay(null);
        this.state = 'PLAYING';
    }

    startWave(num) {
        this.wave = num;
        this.enemiesToSpawn = [];
        const count = 6 + num * 4;
        const scale = 1 + (num - 1) * 0.15;
        for (let i = 0; i < count; i++) {
            let type = 'CHASER';
            const r = Math.random();
            if (num >= 2 && r < 0.25) type = 'RUNNER';
            if (num >= 3 && r > 0.6) type = 'SHOOTER';
            if (num >= 5 && r > 0.85) type = 'TANK';
            this.enemiesToSpawn.push({ type, waveScale: scale });
        }
    }

    spawnEnemy(type, scale) {
        let x, y, dist;
        do {
            x = 40 + Math.random() * 1200;
            y = 40 + Math.random() * 640;
            dist = Math.hypot(x - this.player.x, y - this.player.y);
        } while (dist < 250);
        this.enemies.push(new Enemy(x, y, type, scale));
    }

    triggerLevelUp() {
        this.state = 'LEVEL_UP';
        this.sound.levelUp();
        const container = document.getElementById('upgrade-cards');
        container.innerHTML = '';
        const choices = [...UPGRADES_POOL].sort(() => 0.5 - Math.random()).slice(0, 3);

        choices.forEach(upg => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            if (USER_ASSETS.UPGRADE_CARD_BG) card.style.backgroundImage = `url('${USER_ASSETS.UPGRADE_CARD_BG}')`;
            card.innerHTML = `<div class="card-tag">UPGRADE</div><div class="card-title">${upg.title}</div><div class="card-desc">${upg.desc}</div><div class="card-tag">CLICK TO SELECT</div>`;
            card.addEventListener('click', () => {
                upg.apply(this.player);
                this.setOverlay(null);
                this.state = 'PLAYING';
            });
            container.appendChild(card);
        });
        this.setOverlay('levelup-screen');
    }

    onEnemyKilled(e) {
        this.kills++; this.sound.enemyDeath();
        this.particles.spawn(e.x, e.y, e.color, 16, 1.2);
        this.combo = Math.min(10, this.combo + 1);
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.comboTimer = 3.0;
        this.score += Math.floor(e.score * this.combo * (this.isBulletTime ? 1.5 : 1.0));
        this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + e.bt);
        this.player.addXp(e.xp, this);
        this.addScreenShake(e.type === 'TANK' ? 10 : 4);
    }

    gameOver() {
        this.state = 'GAME_OVER';
        this.sound.gameOver();
        if (this.score > this.highScore) {
            this.highScore = this.score;
            SafeStorage.set('bullet_time_highscore', this.highScore);
        }
        document.getElementById('go-score').textContent = this.score;
        document.getElementById('go-best').textContent = this.highScore;
        document.getElementById('go-wave').textContent = this.wave;
        document.getElementById('go-kills').textContent = this.kills;
        document.getElementById('go-combo').textContent = `x${this.maxCombo}`;
        this.setOverlay('gameover-screen');
    }

    togglePause() {
        if (this.state === 'PLAYING') { this.state = 'PAUSED'; this.setOverlay('pause-screen'); }
        else if (this.state === 'PAUSED') { this.resumeGame(); }
    }

    resumeGame() { this.setOverlay(null); this.state = 'PLAYING'; }

    setOverlay(id) {
        document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
        if (id) document.getElementById(id).classList.remove('hidden');
    }

    addScreenShake(val) { this.screenShake = Math.min(25, this.screenShake + val); }

    loop(timestamp) {
        const rawDt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        const realDt = Math.min(0.1, rawDt);

        if (this.input.isPressed('Escape')) {
            if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                this.togglePause();
                this.input.keys['Escape'] = false;
            }
        }

        if (this.state === 'PLAYING') {
            this.update(realDt);
        }
        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(realDt) {
        const wantsBT = this.input.isPressed('Space') && this.player.energy > 0;
        if (wantsBT && !this.isBulletTime) {
            this.isBulletTime = true;
            this.sound.bulletTimeStart();
        } else if (!wantsBT && this.isBulletTime) {
            this.isBulletTime = false;
        }

        if (this.isBulletTime) {
            this.timeScale = 0.22;
            this.player.energy = Math.max(0, this.player.energy - this.player.energyDrainRate * realDt);
            if (this.player.energy <= 0) this.isBulletTime = false;
        } else {
            this.timeScale = 1.0;
            this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + this.player.energyRegenRate * realDt);
        }

        const dt = realDt * this.timeScale;
        if (this.comboTimer > 0) {
            this.comboTimer -= realDt;
            if (this.comboTimer <= 0) this.combo = 1;
        }

        this.player.update(dt, realDt, this.input, this);

        if (this.enemiesToSpawn.length > 0) {
            this.spawnTimer += dt;
            if (this.spawnTimer >= 0.4) {
                this.spawnTimer = 0;
                const next = this.enemiesToSpawn.pop();
                this.spawnEnemy(next.type, next.waveScale);
            }
        } else if (this.enemies.length === 0) {
            this.startWave(this.wave + 1);
        }

        this.enemies.forEach(e => e.update(dt, this.player, this));

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i]; b.update(dt);
            let dest = b.life <= 0;
            if (!dest) {
                for (let obs of this.obstacles) {
                    if (b.x > obs.x && b.x < obs.x + obs.w && b.y > obs.y && b.y < obs.y + obs.h) { dest = true; break; }
                }
            }
            if (!dest) {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const e = this.enemies[j];
                    if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + b.radius) {
                        dest = true;
                        if (e.takeDamage(b.damage, this)) this.enemies.splice(j, 1);
                        break;
                    }
                }
            }
            if (dest) this.bullets.splice(i, 1);
        }

        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const eb = this.enemyBullets[i]; eb.update(dt);
            let dest = eb.life <= 0;
            if (Math.hypot(eb.x - this.player.x, eb.y - this.player.y) < this.player.radius + eb.radius) {
                dest = true; this.player.takeDamage(eb.damage, this);
            }
            if (dest) this.enemyBullets.splice(i, 1);
        }

        this.enemies.forEach(e => {
            if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.radius + this.player.radius) {
                this.player.takeDamage(e.damage, this);
            }
        });

        this.particles.update(dt);
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - realDt * 30);
        this.updateHUD();
    }

    updateHUD() {
        document.getElementById('hud-wave').textContent = this.wave;
        document.getElementById('hud-score').textContent = String(this.score).padStart(6, '0');
        document.getElementById('hud-kills').textContent = this.kills;
        document.getElementById('hud-combo').textContent = `x${this.combo}`;
        document.getElementById('hp-bar').style.width = `${Math.max(0, (this.player.hp / this.player.maxHp) * 100)}%`;
        document.getElementById('energy-bar').style.width = `${Math.max(0, (this.player.energy / this.player.maxEnergy) * 100)}%`;
        document.getElementById('xp-bar').style.width = `${Math.max(0, (this.player.xp / this.player.nextLevelXp) * 100)}%`;
        
        const st = document.getElementById('bt-status');
        if (this.isBulletTime) { st.textContent = 'BULLET TIME ACTIVE'; st.style.color = '#ff0055'; }
        else if (this.player.energy <= 0) { st.textContent = 'ENERGY RECHARGING'; st.style.color = '#888888'; }
        else { st.textContent = 'BULLET TIME READY'; st.style.color = '#00f3ff'; }
    }

    render() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, 1280, 720);
        if (this.screenShake > 0) {
            this.ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
        }

        const floor = this.assets.get('ARENA_FLOOR');
        if (floor) { this.ctx.drawImage(floor, 0, 0, 1280, 720); } else { this.drawGrid(); }

        this.obstacles.forEach(obs => obs.draw(this.ctx, this));
        this.bullets.forEach(b => b.draw(this.ctx));
        this.enemyBullets.forEach(eb => eb.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx, this));
        if (this.state !== 'GAME_OVER') this.player.draw(this.ctx, this);
        this.particles.draw(this.ctx);

        if (this.isBulletTime) {
            this.ctx.fillStyle = 'rgba(0, 243, 255, 0.05)';
            this.ctx.fillRect(0, 0, 1280, 720);
        }
        this.ctx.restore();
    }

    drawGrid() {
        this.ctx.save();
        this.ctx.strokeStyle = this.isBulletTime ? 'rgba(0, 243, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)';
        for (let x = 0; x < 1280; x += 60) { this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, 720); this.ctx.stroke(); }
        for (let y = 0; y < 720; y += 60) { this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(1280, y); this.ctx.stroke(); }
        this.ctx.restore();
    }
}

// Запуск игры при загрузке страницы
function bootGame() { new Game(); }
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootGame);
} else {
    bootGame();
}
