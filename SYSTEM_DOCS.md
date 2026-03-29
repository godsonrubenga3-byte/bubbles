# BUBBLETZ - SYSTEM ARCHITECTURE & TRACKING

This document outlines the operational logic of the Bubbletz Laundry application as of March 2026.

## 1. CORE OPERATIONAL MANDATES
- **No Background Pinging:** Geolocation is only active when a user clicks the "Auto-detect" button. It is a "one-and-done" action.
- **Database Access:**
  - **Ordering (Write-only):** When placing an order, the app strictly writes to the database. It does not perform any polling or reading until the order is successfully placed.
  - **Tracking (Read-only Polling):** Polling for status updates only occurs when the user is on the 'Track' or 'History' screen. The interval is set to 10 seconds to conserve battery and server resources on Vercel.
- **Data Source of Truth:**
  - User credentials and profile details are stored in `localStorage` upon login/signup.
  - The app retrieves these locally for all forms, reducing database read overhead.

## 2. REFACTORING LOG (Fixing Production Issues)

### Step 1: Vercel & Web Compatibility
- **Issue:** Hardcoded `localhost:3000` URLs caused "Local Network Access" errors in production.
- **Fix:** Implemented a dynamic API URL detector in `src/constants.ts` that uses `window.location.origin` when running on the web and the Vercel URL when running in the native APK.
- **Step Documentation:** Updated `defaultApiUrl` logic to check `Capacitor.isNativePlatform()`.

### Step 2: Geolocation & Map Optimization
- **Issue:** The Capacitor Geolocation plugin's `requestPermissions()` crashed on the web because it's only implemented for native Android/iOS.
- **Fix:** Added a platform check in `src/components/MapPicker.tsx` to only call permission requests on mobile.
- **Accuracy Improvement:** Changed the auto-detect function to prioritize High Accuracy (GPS) -> Standard Accuracy -> IP-based fallback (HTTPS safe).
- **Map Implementation:** Reverted to OpenStreetMap (OSM) for tiles and Nominatim for geocoding to ensure a reliable, dependency-free experience.
- **Leaflet Compatibility:** Implemented a CDN-based icon fix for L.Marker to ensure markers display correctly in the production APK.

### Step 3: Efficient State Management
- **Issue:** Polling was happening on every screen, even the login screen.
- **Fix:** Refactored `src/App.tsx` `useEffect` to only start the `setInterval` if `view === 'track'` or `view === 'history'`.
- **LocalStorage Source:** Ensured the ordering form pulls user info from the locally stored user object rather than fetching it from the API again.

## 3. DEPENDENCY AUDIT
- **@libsql/client:** The primary database client (Turso Cloud).
- **@capacitor/geolocation:** Handled carefully to support both Browser and Android.
- **Vercel Deployment:** Configured via `vercel.json` to handle rewrites for the SPA (Single Page Application) routing.
- **Socket.io:** Maintained as a secondary option, but Polling is the primary robust method for Vercel's serverless environment.

## 4. ANDROID APK BUILD (PROPRIETARY)
- To build the APK, run: `npm run apk:build`
- This script builds the Vite web assets, syncs them to the Capacitor Android project, and compiles the Gradle project.
