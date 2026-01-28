# 🚀 Action Plan: Rebuild & Redeploy

Follow these exact steps to apply your latest changes (Notifications, Icons, Security Fixes).

---

## 1. Redeploy Backend (Render)
**Why?** To apply the new Notification logic (`expo-server-sdk`) and API security checks.

1.  **Open Terminal** in VS Code.
2.  **Commit & Push** your changes:
    ```bash
    git add .
    git commit -m "feat: notifications, icons, and admin security"
    git push origin main
    ```
3.  **Go to Render Dashboard**:
    -   Find your Backend Service.
    -   Click **Manual Deploy** > **Deploy latest commit** (or it might auto-deploy).
    -   Wait for the "Build Successful" and "Service is Live" message.

---

## 2. Rebuild Mobile Apps (Expo)
**Why?** To apply the new **App Icons**, **Fees Screen Fix**, and **Receipt Sharing Fix**. These are "native" changes, so a full rebuild is required (OTA update is not enough).

### Student App
Run these commands in your VS Code terminal:

```powershell
# 1. Navigate to student folder
cd "student-app"

# 2. Build for Android (Installable APK)
eas build --platform android --profile preview
```
*   Wait for the build to finish.
*   **Download the APK** from the link provided or scan the QR code.
*   **Install** it on your phone (Uninstall the old one first if signatures mismatch).

### Teacher App
Open a **new** terminal (or `cd ..` back to root) and run:

```powershell
# 1. Navigate to teacher folder
cd "teacher-app"

# 2. Build for Android (Installable APK)
eas build --platform android --profile preview
```
*   Wait for build.
*   Download and Install.

---

## 3. Redeploy Admin Panel (Vercel)
**Why?** To apply the **"Restrict Login"** security fix.

1.  **Push Changes**: You already did this in Step 1.
2.  **Go to Vercel Dashboard**:
    -   Select your Admin Panel project.
    -   It should **automatically start building** when you pushed to GitHub.
    -   Check the "Deployments" tab to verify the latest commit is "Ready".
3.  **Verify**:
    -   Open your Admin Panel URL.
    -   Try logging in as a "Student" or "Teacher".
    -   You should see the "Access Denied" error.
