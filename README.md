# 🕹️ AR Cyber Shooter

> A browser-based Augmented Reality shooting game built with **Three.js** and **MediaPipe**.

![Game Banner](https://media.giphy.com/media/Is0AJv4C75SN2/giphy.gif)

## 🚀 Concept
An immersive AR experience where players use hand gestures to aim and shoot virtual targets floating in their real-world environment.


https://github.com/user-attachments/assets/f5d62eb9-540e-4831-975d-41530cfb2d76




## 🛠️ Tech Stack
* **Three.js**: 3D Rendering & Physics.
* **MediaPipe Hands**: Real-time hand tracking & gesture recognition.
* **Vite**: Fast tooling & bundling.
* **Procedural Audio**: Sound synthesis using Web Audio API (No assets needed).

## 🎮 How to Play
1.  **Aim:** Point your index finger to control the laser crosshair.
2.  **Shoot:** Fold your thumb down (Pistol Gesture) to fire.
3.  **Goal:** Destroy incoming cyber-rings before they pass you.

## 📦 Installation
## ⚙️ Customization (God Mode)
Want to tweak the difficulty? You can adjust the game physics in `src/main.js`:

```javascript
// Inside ARGame constructor:
this.enemySpeed = 0.04;         // Increase to make enemies faster (e.g., 0.1)
this.triggerSensitivity = 0.08; // Adjust trigger threshold (Lower = Harder to shoot)
this.aimAssistRadius = 3.0;     // Magnet Aim Radius (3.0 = Easy, 0.5 = Pro)
```
```bash
# 1. Clone the repo
git clone [https://github.com/seif-elmuselmani/AR-Cyber-Shooter.git](https://github.com/seif-elmuselmani/AR-Cyber-Shooter.git)

# 2. Install dependencies
npm install

# 3. Run locally
npm run dev
```



