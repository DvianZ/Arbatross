# 🛰️ ARBATROSS — ArbaLabs Orbital Mission Control Interface

ARBATROSS is a futuristic, highly responsive, and cinematic mission control dashboard designed for **ArbaLabs**' orbital demonstration campaign launching in September 2026. This interface serves as a public campaign tool to visualize real-time mission telemetry, satellite trajectories, AI co-processor health, and cryptographic integrity verifications.

Developed as a modern web application, the dashboard features a dark, high-contrast HUD aesthetic styled with **Vanilla CSS** and powered by **Next.js (App Router)** and **React Three Fiber (Three.js)**.

---

## 🚀 Key Features

*   **3D Orbital Globe**: An interactive 3D planet Earth displaying the satellite's orbital plane (51.6° inclination). Clicking on the satellite triggers a smooth zoom-in cinematic focus mode that locks onto and follows the satellite's position while preserving the user's freedom to rotate and zoom.
*   **2D Ground Track Map**: A centered 2:1.5 letterboxed equirectangular map utilizing real Earth textures with responsive scaling, showing past and future satellite ground tracks.
*   **Monotonic Clock & Simulation**: Real-time simulation running at 1 step per second (representing 1 minute of orbital time) with simulated time and clocks progressing continuously forward, avoiding any loops or snaps.
*   **Telemetry Monitor**: Live-updated readouts tracking crucial telemetry metrics like CPU temperature, battery power, solar cell load, altitude, and velocity.
*   **Edge AI Integrity Verification**: Real-time logging of cryptographic validation hashes generated on-board to prove the integrity of the satellite's edge computing payloads.
*   **MET Countdown Timer**: T+ Mission Elapsed Time (MET) counter computing days, hours, minutes, and seconds since the historic ISS launch date (`1998-11-20`).
*   **Mobile Responsive Grid**: Dynamically collapses to a single-column layout on mobile devices, wraps navigation clocks cleanly to prevent overlapping, and hides split screen layouts when space is constrained.

---

## 📁 Component Structure & Architecture

```text
arbatross/
├── public/                 # Static assets
│   ├── models/             # 3D assets
│   │   └── satellite.glb   # Satellite 3D model
│   ├── textures/           # WebGL textures
│   │   └── earth_day.png   # High-resolution Earth texture map
│   └── logo.png            # ArbaLabs brand logo logo
│
├── src/
│   ├── app/                # App Router root
│   │   ├── layout.js       # Global document structure
│   │   ├── page.js         # Dashboard layout, state manager & intervals
│   │   └── globals.css     # Global styles & layout variables
│   │
│   ├── components/         # Modular UI Components
│   │   ├── Navbar.jsx          # Header with UTC/MET clocks & configuration cog
│   │   ├── MissionCountdown.jsx# Pulse countdown circle & launch metrics
│   │   ├── VerificationPanel.jsx# Checklist of system statuses & cryptographic logs
│   │   ├── TelemetryPanel.jsx  # Telemetry indicator grids and canvas sparklines
│   │   ├── OrbitalGlobe.jsx    # WebGL 3D Globe (React Three Fiber)
│   │   └── OrbitalMap2D.jsx    # Canvas-rendered 2D Ground Track
│   │
│   ├── context/
│   │   └── MissionContext.jsx  # Global state (launch date & active view)
│   │
│   └── lib/
│       ├── missionConfig.js      # Centralized orbital constants & config helper
│       └── telemetrySimulator.js # Telemetry generation algorithms
```

---

## 🛠️ Installation & Setup Instructions

To run the dashboard locally in your environment, follow these steps:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended).

### 1. Clone & Navigate to project directory
```bash
git clone <your-repository-url>
cd arbatross
```

### 2. Install Dependencies
Install all packages, including React Three Fiber and Three.js requirements:
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Access the Dashboard
Open your browser and navigate to:
```text
http://localhost:3000
```

---

## 🎨 Design System & CSS Variables

The styles are managed globally inside `src/app/globals.css`. The design uses colors tailored to the **ArbaLabs** corporate identity:

*   **Backgrounds**: Dark theme (`#070A0F` base, `#040608` deep contrast space).
*   **Panels**: Glassmorphic borders (`#0B1020` card color with subtle radial accent lights).
*   **Accents**: NASA-inspired sci-fi glow (`#00FFD0` bright cyan, `#4A9EFF` space blue).
*   **Typography**: Styled using Google Fonts:
    *   **Titles/UI**: *Space Grotesk* for a modern aerospace layout.
    *   **Data/Logs**: *JetBrains Mono* for telemetry tables and telemetry consoles.

---

## ⚙️ Camera Focus & Aspect Ratio Specifications

### Fixed 2:1.5 Aspect Ratio Map
To ensure that the 2D ground track map is never squished, the canvas calculates its size based on a fixed 2:1.5 ratio:

```
Ratio = W / H = 2 / 1.5 ≈ 1.33
```

If the container size differs, the drawing automatically scales and offsets the render output within the viewport (letterboxing).

### Camera Follow Mechanics
When focusing on the satellite, we calculate the satellite position delta between consecutive animation frames `(p[n] − p[n-1])` and translate the camera's position by that exact displacement. This keeps the camera's relative coordinates locked to the satellite's motion, while letting OrbitControls spin and zoom freely:

```
C[n] = C[n-1] + (S[n] − S[n-1])
```

Where **C** is the Camera position vector, and **S** is the Satellite position vector.
