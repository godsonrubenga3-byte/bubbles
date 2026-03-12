# Supabase & Julia Server Integration Guide

This guide will help you connect your React frontend to both **Supabase** (for Authentication) and your **Julia Server** (for Order Management).

---

## 1. Get Your Supabase Credentials

To use Supabase for login and signup, follow these steps:

1.  **Create a Project**: Go to [supabase.com](https://supabase.com) and sign in. Click **New Project**.
2.  **Project Details**: Give your project a name (e.g., "Bubbles Laundry") and set a secure database password.
3.  **Wait for Initialization**: It usually takes a minute for the project to be ready.
4.  **Find API Keys**:
    *   On the left sidebar, click the **Settings** (gear icon).
    *   Go to **API**.
    *   **Project URL**: Copy the URL (it looks like `https://xyzabc.supabase.co`).
    *   **Project API Keys**: Copy the `anon` / `public` key. **Never share the `service_role` key!**

---

## 2. Configure Your Environment Variables

Create a file named `.env` in the root of your project (`/home/blue/Desktop/ToDo/bubbles/.env`) and paste the following:

```env
# Supabase Configuration
VITE_SUPABASE_URL=YOUR_PROJECT_URL_HERE
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY_HERE

# Julia Server Configuration
# Ensure your Julia server is running and listening on this port.
VITE_JULIA_SERVER_URL=http://localhost:8080
```

> **Note**: Replace `YOUR_PROJECT_URL_HERE` and `YOUR_ANON_PUBLIC_KEY_HERE` with the values you copied in Step 1.

---

## 3. Finalize the Code Integration

Once you have your credentials, you need to initialize the Supabase client in your React app.

### A. Install the Library
Run this in your terminal:
```bash
npm install @supabase/supabase-js
```

### B. Create the Supabase Client
Create a new file `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### C. Update handleAuth in App.tsx
Now you can replace the "Mock Auth" logic in `App.tsx` with actual Supabase calls:

```typescript
// Replace your existing handleAuth logic with this:
const handleAuth = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  if (authMode === 'signup') {
    const { data, error } = await supabase.auth.signUp({
      email: authForm.email,
      password: authForm.password,
    });
    if (error) alert(error.message);
  } else {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authForm.email,
      password: authForm.password,
    });
    if (error) alert(error.message);
  }
  setLoading(false);
};
```

---

## 4. Julia Server Health Check

Make sure your Julia server is running before testing. You can test if it's reachable by running this in your terminal:

```bash
curl http://localhost:8080/api/orders
```

If you see a JSON response (even if it's an empty list `[]`), your frontend is ready to start sending laundry orders!
