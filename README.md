<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# BUBBLES Laundry

> Premium laundry service in Dar es Salaam, Tanzania. Order pickups, track your laundry status, and enjoy special Saturday discounts.

BUBBLES is a full-stack web application that provides on-demand laundry pickup and delivery services in Dar es Salaam, Tanzania. The app features interactive map-based location selection, real-time order tracking, and user authentication.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📦 **Order Pickups** | Place laundry pickup orders with just a few taps |
| 📍 **Map Selection** | Interactive map (Leaflet) to pin your exact pickup location |
| 🌍 **Geolocation** | Auto-detect your address using browser geolocation API |
| 🗓️ **Saturday Discounts** | Special pricing every Saturday (up to 40% off) |
| 📊 **Order Tracking** | Real-time status updates from Pending to Delivered |
| 👤 **User Accounts** | Secure signup/login to view order history |
| 🌙 **Dark Mode** | Beautiful dark mode support |

## 💰 Pricing

| Item | Regular Price | Saturday Price |
|------|---------------|----------------|
| Normal clothes (per kg) | $2.50 | $1.50 |
| Blankets (each) | $5.00 | $4.00 |

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v4** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **React Leaflet** - Interactive maps
- **Lucide React** - Icon library

### Backend
- **Express.js** - Node.js web framework
- **@libsql/client** - Turso (libSQL) database client
- **Vite** - Next-generation build tool

### Services
- **Leaflet / OpenStreetMap** - Map services

## 📋 Prerequisites

Before running the application, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bubbles
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the project root with your Gemini API key and Turso credentials:

```env
GEMINI_API_KEY=your_gemini_api_key_here
TURSO_URL=libsql://your-db-name-org.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token_here
```

> **Note:** Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and your Turso credentials from the [Turso Dashboard](https://turso.tech/).


### 4. Run the Application

```bash
npm run dev
```

The application will start at **http://localhost:3000**

## 📁 Project Structure

```
bubbles/
├── src/
│   ├── components/
│   │   └── MapPicker.tsx      # Interactive map component
│   ├── App.tsx                # Main React application
│   ├── constants.ts           # Pricing and configuration
│   ├── cn.ts                  # Tailwind class merger utility
│   ├── index.css              # Global styles
│   └── main.tsx               # Application entry point
├── server.ts                  # Express backend server
├── index.html                 # HTML template
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite configuration
└── README.md                  # This file
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signup` | Create new user account |
| POST | `/api/login` | Authenticate user |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/:id` | Get order by ID |
| GET | `/api/orders/user/:userId` | Get user's order history |
| POST | `/api/orders` | Create new order |
| POST | `/api/orders/:id/cancel` | Cancel pending order |

## 🎨 Customization

### Modifying Prices

Edit the pricing in `src/constants.ts`:

```typescript
export const PRICING = {
  NORMAL: {
    REGULAR: 2.5,    // Regular price per kg
    SATURDAY: 1.5   // Saturday price per kg
  },
  BLANKET: {
    REGULAR: 5.0,   // Regular price per blanket
    SATURDAY: 4.0   // Saturday price per blanket
  }
};
```

### Map Location

Change the default map center in `src/constants.ts`:

```typescript
export const TANZANIA_BOUNDS = {
  center: [-6.7924, 39.2083] as [number, number],
  zoom: 12
};
```

## 📱 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run clean` | Remove build artifacts |
| `npm run lint` | Type-check the code |

## 🏗️ Building for Production

```bash
# Build the frontend
npm run build

# Preview the production build
npm run preview
```

The production files will be in the `dist/` directory.

## 📄 License

This project is private and proprietary. All rights reserved.

## 🙏 Acknowledgments

- [Leaflet](https://leafletjs.com/) - Open-source maps
- [Google Gemini](https://gemini.google.com/) - AI capabilities
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide](https://lucide.dev/) - Beautiful icons

---

<div align="center">
  Made with ❤️ in Dar es Salaam, Tanzania
</div>

