/**
 * ==========================================================
 * 1. I'M Just a Seif
 * ==========================================================
 */

import * as THREE from "three";
import gsap from "gsap";

/**
 * ==========================================================
 * 1. Audio System (Professional Synth)
 * ==========================================================
 */
class AudioSynth {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);
  }

  playTone(freq, type, duration, slideTo = null) {
    if (this.ctx.state === "suspended") this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(
        slideTo,
        this.ctx.currentTime + duration
      );
    }

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.ctx.currentTime + duration
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playShoot() {
    this.playTone(800, "sawtooth", 0.15, 100);
  }

  playHit() {
    this.playTone(150, "square", 0.1);
    this.playTone(100, "sawtooth", 0.2, 50);
  }
}

/**
 * ==========================================================
 * 2. Game Engine (Easy / God Mode)
 * ==========================================================
 */
class ARGame {
  constructor() {
    // Game State
    this.score = 0;
    this.enemies = [];
    this.particles = [];
    this.isLoaded = false;

    // --- إعدادات السهولة (God Mode Settings) ---
    this.enemySpeed = 0.04; // بطيء جداً (للسيطرة التامة)
    this.triggerSensitivity = 0.08; // حساس جداً (أقل حركة تطلق النار)
    this.aimAssistRadius = 3.0; // نصف قطر  (كبير جداً)

    // Hand State
    this.handPos = { x: 0.5, y: 0.5 };
    this.isTriggerPulled = false;
    this.lastTriggerState = false;
    this.lockedEnemy = null;

    // Systems
    this.audio = new AudioSynth();
    this.raycaster = new THREE.Raycaster();

    this.initThree();
    this.initVisuals();
    this.initMediaPipe();
    this.gameLoop();
  }

  initThree() {
    this.scene = new THREE.Scene();

    this.scene.fog = new THREE.FogExp2(0x000000, 0.015);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document
      .getElementById("canvas-container")
      .appendChild(this.renderer.domElement);

    const light = new THREE.DirectionalLight(0x00ffcc, 1);
    light.position.set(2, 2, 5);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1));

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    // هتعدل فيه هتخليها فوضي ):
    setInterval(() => this.spawnEnemy(), 1200);
    //
  }

  initVisuals() {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1, 4),
      new THREE.Vector3(0, 0, -20),
    ]);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.8,
      linewidth: 3,
    });
    this.laserLine = new THREE.Line(geometry, material);
    this.scene.add(this.laserLine);
  }

  createExplosion(position) {
    const particleCount = 25;
    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0055 });

    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8
      );
      particle.userData.life = 1.0;
      this.scene.add(particle);
      this.particles.push(particle);
    }
  }

  initMediaPipe() {
    const videoElement = document.getElementById("input-video");
    const hands = new window.Hands({
      locateFile: (file) =>
        `https://unpkg.com/@mediapipe/hands@0.4.1646424915/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      if (
        !results.multiHandLandmarks ||
        results.multiHandLandmarks.length === 0
      )
        return;
      const landmarks = results.multiHandLandmarks[0];

      const rawX = 1 - landmarks[8].x;
      const rawY = landmarks[8].y;
      this.handPos.x += (rawX - this.handPos.x) * 0.15;
      this.handPos.y += (rawY - this.handPos.y) * 0.15;

      const thumbTip = landmarks[4];
      const indexBase = landmarks[5];
      const distance = Math.sqrt(
        Math.pow(thumbTip.x - indexBase.x, 2) +
          Math.pow(thumbTip.y - indexBase.y, 2)
      );

      this.isTriggerPulled = distance < this.triggerSensitivity;

      if (this.isTriggerPulled && !this.lastTriggerState) this.shoot();
      this.lastTriggerState = this.isTriggerPulled;
    });

    const camera = new window.Camera(videoElement, {
      onFrame: async () => await hands.send({ image: videoElement }),
      width: 1280,
      height: 720,
    });

    camera.start().then(() => {
      document.getElementById("loading-screen").style.display = "none";
      document.getElementById("hud").style.display = "block";
      this.isLoaded = true;
    });
  }

  spawnEnemy() {
    if (!this.isLoaded || this.enemies.length >= 8) return;

    const geometry = new THREE.TorusGeometry(0.7, 0.15, 8, 30);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
      emissive: 0x333333,
      metalness: 0.9,
      roughness: 0.1,
    });
    const enemy = new THREE.Mesh(geometry, material);

    enemy.position.x = (Math.random() - 0.5) * 16;
    enemy.position.y = (Math.random() - 0.5) * 10;
    enemy.position.z = -30;

    this.scene.add(enemy);
    this.enemies.push(enemy);
  }

  updateCrosshair() {
    const crosshair = document.getElementById("crosshair");
    const x = this.handPos.x * window.innerWidth;
    const y = this.handPos.y * window.innerHeight;
    crosshair.style.left = `${x}px`;
    crosshair.style.top = `${y}px`;

    this.raycaster.setFromCamera(
      new THREE.Vector2(this.handPos.x * 2 - 1, -(this.handPos.y * 2) + 1),
      this.camera
    );

    let closestDist = 999;
    this.lockedEnemy = null;
    const ray = this.raycaster.ray;

    this.enemies.forEach((enemy) => {
      const vec = new THREE.Vector3();
      ray.closestPointToPoint(enemy.position, vec);
      const distanceToRay = vec.distanceTo(enemy.position);

      if (distanceToRay < this.aimAssistRadius) {
        if (distanceToRay < closestDist) {
          closestDist = distanceToRay;
          this.lockedEnemy = enemy;
        }
      }
    });

    if (this.lockedEnemy) {
      crosshair.classList.add("locked-on");

      this.updateLaser(this.lockedEnemy.position);
    } else {
      crosshair.classList.remove("locked-on");
      const vec = new THREE.Vector3();
      ray.at(20, vec);
      this.updateLaser(vec);
    }
  }

  updateLaser(targetPoint) {
    const startPoint = new THREE.Vector3(
      (this.handPos.x * 2 - 1) * 2,
      -(this.handPos.y * 2 - 1) * 2 - 1,
      4
    );
    const positions = this.laserLine.geometry.attributes.position.array;
    positions[0] = startPoint.x;
    positions[1] = startPoint.y;
    positions[2] = startPoint.z;
    positions[3] = targetPoint.x;
    positions[4] = targetPoint.y;
    positions[5] = targetPoint.z;
    this.laserLine.geometry.attributes.position.needsUpdate = true;
  }

  shoot() {
    this.audio.playShoot();
    document.getElementById("crosshair").classList.add("shooting");
    setTimeout(
      () => document.getElementById("crosshair").classList.remove("shooting"),
      100
    );

    if (this.lockedEnemy) {
      this.destroyEnemy(this.lockedEnemy);
      this.lockedEnemy = null;
    }
  }

  destroyEnemy(enemy) {
    this.audio.playHit();
    this.score += 100;
    document.getElementById("score").innerText = this.score
      .toString()
      .padStart(4, "0");
    this.createExplosion(enemy.position);
    this.scene.remove(enemy);
    this.enemies = this.enemies.filter((e) => e !== enemy);
  }

  gameLoop() {
    requestAnimationFrame(() => this.gameLoop());
    if (!this.isLoaded) return;

    this.updateCrosshair();

    this.enemies.forEach((enemy) => {
      enemy.position.z += this.enemySpeed;
      enemy.rotation.x += 0.01;
      enemy.rotation.y += 0.01;
      if (enemy.position.z > 5) enemy.position.z = -30;
    });

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.position.add(p.userData.velocity);
      p.userData.life -= 0.03;
      p.scale.setScalar(p.userData.life);
      if (p.userData.life <= 0) {
        this.scene.remove(p);
        this.particles.splice(i, 1);
      }
    }
    this.renderer.render(this.scene, this.camera);
  }
}

new ARGame();
