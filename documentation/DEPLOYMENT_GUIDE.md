# System Deployment Guide

This guide covers the deployment of the Node.js Backend to Render and the building of Mobile Apps (APK) using Expo EAS.

---

## Part 1: Backend Deployment (Render)

### 1. Prerequisites
-   A [Render](https://render.com) account.
-   Code pushed to a GitHub repository.

### 2. Deployment Steps
1.  **Create Service**:
    -   Log in to Render Dashboard.
    -   Click **New +** > **Web Service**.
    -   Connect your GitHub repository.
2.  **Configuration**:
    -   **Root Directory**: `backend` (Important as your repo is a monorepo).
    -   **Runtime**: Node.js.
    -   **Build Command**: `npm install`
    -   **Start Command**: `npm start`
    -   **Plan**: Free (or Starter for production).
3.  **Environment Variables**:
    -   Go to the **Environment** tab in Render.
    -   Add the following keys (copy values from your local `.env`):
        -   `SUPABASE_URL`
        -   `SUPABASE_SERVICE_ROLE_KEY` (Used for Admin ops)
        -   `SUPABASE_ANON_KEY`
        -   `NODE_VERSION`: `20`

### 3. Verification
Render will deploy the service and provide a URL (e.g., `https://school-erp-backend.onrender.com`).
Test it by visiting: `https://<your-url>/ping`. You should see "Pong".

---

## Part 2: Mobile Apps Build (Expo EAS)

We use a "Safe Build" strategy to protect your source code during the build process.

### 1. Prerequisites
-   Install EAS CLI: `npm install -g eas-cli`
-   Login to Expo: `eas login`

### 2. The "Safe Build" Workflow
We copy the apps to a temporary folder to build them, ensuring no temporary build artifacts clutter your main project.

Run these commands in PowerShell:

#### Step A: Create Build Workspace
```powershell
# Go to project root
cd 'C:\Users\Burhan\Documents\biggest project'

# Create/Clear build folder
if (Test-Path "builds") { Remove-Item "builds" -Recurse -Force }
mkdir builds

# Copy Apps
Copy-Item -Path "teacher-app" -Destination "builds\teacher-app-build" -Recurse
Copy-Item -Path "student-app" -Destination "builds\student-app-build" -Recurse
```

#### Step B: Build Teacher App (Android APK)
```powershell
cd builds\teacher-app-build

# Configure (First time only)
eas build:configure 
# Select 'Android' -> It creates eas.json

# Build Preview APK (Installable on device)
eas build -p android --profile preview
```
*Wait for the QR code and download link.*

#### Step C: Build Student App (Android APK)
```powershell
cd ..\student-app-build
eas build:configure
eas build -p android --profile preview
```

### 3. Updates (OTA)
If you make small JS changes (no new native packages), you can publish updates instantly without downloading a new APK:
```powershell
eas update --branch preview --message "Fixed bug"
```

---

## Part 3: Web Admin Panel (Netlify)

1.  **Build Command**: `npm run build` (This runs `next build`).
2.  **Publish Directory**: `out` (Since we use static export).
3.  **Config**: Ensure `netlify.toml` is present in the project root to handle redirects.
4.  **Drag & Drop**: Simply drag the `out` folder to Netlify Drop for instant hosting.
