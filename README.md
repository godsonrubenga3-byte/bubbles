# BUBBLES Laundry

> Premium laundry service in Chitungwiza, Zimbabwe. Order pickups, track your laundry status, and enjoy special Saturday discounts.

BUBBLES is a full-stack web application that provides on-demand laundry pickup and delivery services in Chitungwiza, Zimbabwe. The app features interactive map-based location selection, real-time order tracking, user authentication, and an AI-powered chat assistant for customer support.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📦 **Order Pickups** | Place laundry pickup orders with just a few taps |
| 📍 **Map Selection** | Interactive map (Leaflet) to pin your exact pickup location |
| 🌍 **Geolocation** | Auto-detect your address using browser geolocation API |
| 💬 **AI Chat Assistant** | Gemini-powered chatbot for order help and support |
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
- **better-sqlite3** - Fast SQLite database
- **Vite** - Next-generation build tool

### AI & Services
- **Google Gemini** - AI chat assistant
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

Create a `.env.local` file in the project root with your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note:** Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

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
export const CHITUNGWIZA_BOUNDS = {
  center: [-18.0127, 31.0797] as [number, number],
  zoom: 13
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
  Made with ❤️ in Tanzania, Africa
</div>

