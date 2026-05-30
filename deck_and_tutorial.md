# 📊 Arbatross: Presentation Deck & Interface Tutorial Guide

This document contains the slide-by-slide presentation deck structure and the user guide/tutorial steps for the **Arbatross Orbital Mission Control Dashboard** built for **ArbaLabs**.

---

## 🗂️ Part 1: Presentation Deck Outline

### Slide 1: Title & Introduction
*   **Slide Header**: Project Arbatross: Orbital Mission Control Interface
*   **Subtitle**: Edge AI Integrity Verification and Telemetry Visualizer
*   **Visual Suggestion**: High-resolution screenshot of the dashboard's 3D Globe focused on the satellite.
*   **Key Talking Points**:
    *   Intro to the aerospace campaign launching in September 2026.
    *   Overview of the design language: NASA-inspired, high-contrast dark HUD aesthetic.
    *   Purpose: Highlighting ArbaLabs' edge computing systems and aerospace integrity verification platform.

### Slide 2: The Core Challenge
*   **Slide Header**: Visualizing High-Velocity Orbital Data
*   **Key Talking Points**:
    *   Traditional dashboards either suffer from flat vector map distortion or sluggish WebGL renders.
    *   How we resolved this with a dual-system visualization: 3D interactive viewport + 2D ground track mapping.
    *   Challenge: Delivering real-time interactive responsiveness without high CPU/GPU overhead.

### Slide 3: 3D WebGL Orbital Engine
*   **Slide Header**: Cinematic 3D Globe & Satellite Focus
*   **Visual Suggestion**: Comparison diagram showing Orbit Earth Center vs. Orbit Satellite Center views.
*   **Key Talking Points**:
    *   Uses **React Three Fiber** and **Three.js** to render a coordinate-accurate satellite orbit path (51.6° inclination).
    *   **Cinematic Camera Tracking**: Calculates translation deltas ($\vec{S}_{n} - \vec{S}_{n-1}$) on every frame to move the camera in unison with the satellite's position.
    *   Keeps OrbitControls fully unlocked, allowing operators to spin and zoom around the moving satellite.

### Slide 4: 2D Projection & Aspect Ratio Calibration
*   **Slide Header**: Distortion-Free 2D Ground Track Map
*   **Visual Suggestion**: Screenshot of the 2D canvas map centered with letterboxing.
*   **Key Talking Points**:
    *   Draws real Earth textures (`earth_day.png`) directly onto an HTML5 Canvas context.
    *   Calibrated to a strict **2:1.5 (4:3) aspect ratio** layout.
    *   Uses active letterbox calculations to translate drawing offsets, preventing map stretching when resizing.

### Slide 5: Edge AI Integrity Check
*   **Slide Header**: Verifying AI Payload Authenticity in LEO
*   **Visual Suggestion**: Close-up of the Verification Panel checkmarks and the scrolling hash logs.
*   **Key Talking Points**:
    *   Simulates cryptographic hashes of on-board AI integrity checks.
    *   Displays real-time logs of AI inference counts and validation hash strings.
    *   Provides telemetry metrics (CPU core temperatures, battery status, solar loads) to ensure co-processors remain within nominal thresholds.

### Slide 6: Mobile Responsiveness & Layout Architecture
*   **Slide Header**: Mission Control in Your Pocket
*   **Visual Suggestion**: Mobile layout screenshot showing stacked components and wrapped navbar rows.
*   **Key Talking Points**:
    *   Responsive columns: Stacks dynamic telemetry and checking grids vertically on mobile screens.
    *   **Collision-Free Header**: Splits navigation bars into a logo row and clock row under 600px width.
    *   **Gated Split-Screen**: Disables and hides the resource-heavy Split View on narrow devices.

---

## 🛠️ Part 2: Step-by-Step Interface Tutorial

### Step 1: Running the Dashboard Locally
1.  Open your terminal inside the project folder (`arbatross/`).
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to `http://localhost:3000`. By default, you will land on the **2D view**.

### Step 2: Customizing the Launch Time (Admin Settings)
1.  Locate the gear icon (`⚙️`) in the top-right corner of the navigation bar.
2.  Click the icon to open the **Mission Configuration Modal**.
3.  Select a new date and time inside the input selector.
4.  Click **Apply Settings**. Notice that:
    *   The **Mission Countdown** circular progress ring and countdown clocks recalibrate.
    *   The **MET Clock** (Mission Elapsed Time) starts counting either `T-` (pre-launch countdown) or `T+` (elapsed flight duration) based on your selected date.

### Step 3: Focusing & Interacting with the 3D Satellite
1.  Select **3D** in the visualization selector toolbar.
2.  Rotate, pan, and zoom around the global Earth view by clicking and dragging on the screen.
3.  To focus on the satellite:
    *   Click on the **3D Satellite Model** moving along the orbit path, OR
    *   Click the **`FOCUS ON SATELLITE`** button in the bottom-right corner.
4.  Watch the camera glide and zoom in close onto the satellite. Drag your mouse to rotate and scroll to zoom—the view remains locked to the satellite's position.
5.  To reset the camera view back to the global Earth center, click **`CENTER ON EARTH`** in the bottom-right corner.

### Step 4: Monitoring Telemetry & Verification Logs
1.  Look at the right column to monitor real-time aerospace telemetry values.
2.  Inspect the **Verification Panel** on the left column:
    *   Confirm checkmark statuses of orbital sub-systems.
    *   Observe the scrolling **Payload Verification Log** console displaying cryptographic verification hashes generated in real-time.

### Step 5: Mobile Layout Inspection
1.  Open the Developer Tools in your browser (`F12` -> Toggle Device Toolbar).
2.  Set the screen width to `< 768px` (e.g., iPhone or Pixel viewports).
3.  Observe that:
    *   All cards collapse cleanly into a single vertical stream.
    *   The 2D Earth map adjusts to preserve its 2:1.5 ratio with letterbox margins.
    *   Under `600px`, the header clocks split cleanly into a double-row, preventing any overlapping.
