import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Circle, 
  MapPin, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle2, 
  Search, 
  Plus, 
  Minus, 
  Calendar,
  ChevronRight,
  Info,
  History,
  Phone,
  User,
  LogOut,
  XCircle,
  Sun,
  Moon,
  Settings,
  Navigation,
  MessageSquare,
  Map as MapIcon
} from 'lucide-react';

const BubblesIcon = ({ className }: { className?: string }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <Circle className="w-full h-full fill-current opacity-80" />
    <Circle className="absolute -top-1 -right-1 w-1/2 h-1/2 fill-current opacity-60" />
    <Circle className="absolute -bottom-0.5 -left-0.5 w-1/3 h-1/3 fill-current opacity-40" />
  </div>
);
import MapPicker from './components/MapPicker';
import { calculatePrice, isSaturday, PRICING } from './constants';
import { cn } from './cn';

type OrderStatus = 'Pending' | 'Picked Up' | 'Washing' | 'Drying' | 'Ready for Delivery' | 'Delivered' | 'Cancelled';

interface UserData {
  id: string;
  email: string;
  name: string;
  username: string;
  phone: string;
  is_whatsapp: boolean;
  address: string;
  lat: number;
  lng: number;
  location_name?: string;
}

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  clothes_weight: number;
  blankets_count: number;
  total_price: number;
  status: OrderStatus;
  created_at: string;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('bubbletz_theme');
      return saved === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bubbletz_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bubbletz_theme', 'light');
    }
  }, [darkMode]);

  const [user, setUser] = useState<UserData | null>(() => {
    try {
      const saved = localStorage.getItem('bubbletz_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Ensure it has basic structure
      return (parsed && typeof parsed === 'object' && parsed.id) ? parsed : null;
    } catch (err) {
      console.error("Failed to parse user from localStorage", err);
      return null;
    }
  });

  const [view, setView] = useState<'home' | 'order' | 'track' | 'history' | 'auth' | 'settings'>(() => {
    return user ? 'home' : 'auth';
  });

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    username: '', 
    phone: '', 
    is_whatsapp: true,
    address: '',
    lat: 0,
    lng: 0,
    location_name: ''
  });

  const [orderHistory, setOrderHistory] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('bubbletz_orders');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [orderId, setOrderId] = useState('');
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    weight: 0,
    blankets: 0,
    lat: 0,
    lng: 0,
    location_name: ''
  });

  const saturday = isSaturday();
  formData.address = formData.location_name || formData.address;
  useEffect(() => {
    if (user) {
      // Pre-fill form from user data, ensuring no undefined values
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        lat: user.lat || 0,
        lng: user.lng || 0,
        location_name: user.location_name || ''
      }));
      fetchUserHistory();
    }
  }, [user]);

  useEffect(() => {
    if (orderHistory.length > 0) {
      localStorage.setItem('bubbletz_orders', JSON.stringify(orderHistory));
    }
  }, [orderHistory]);

  const fetchUserHistory = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/orders/user/${user.id}`);
      if (response.ok) {
        const orders = await response.json();
        setOrderHistory(orders);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const syncToSupabase = async (userData: UserData) => {
    localStorage.setItem('bubbletz_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (authMode === 'signup' && authForm.lat === 0) {
      setError('Please select your location on the map');
      setLoading(false);
      return;
    }

    try {
      const endpoint = authMode === 'signup' ? '/api/signup' : '/api/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authMode === 'signup' ? authForm : { email: authForm.email, password: authForm.password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Authentication failed');
      }

      const userData = await response.json();
      await syncToSupabase(userData);
      setView('home');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const updatedUser = { 
      ...user, 
      ...authForm, 
      id: user.id,
      address: authForm.address || user.address || ''
    };
    setUser(updatedUser);
    localStorage.setItem('bubbletz_user', JSON.stringify(updatedUser));
    alert('Profile updated successfully!');
    setView('home');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bubbletz_user');
    setView('auth');
  };

  const handleCancelOrder = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${id}/cancel`, { method: 'POST' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel order');
      }
      setOrderHistory(prev => prev.map(o => o.id === id ? { ...o, status: 'Cancelled' } : o));
      if (trackingOrder && trackingOrder.id === id) {
        setTrackingOrder({ ...trackingOrder, status: 'Cancelled' });
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!orderId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch order');
      }
      
      const order = await response.json();
      setTrackingOrder(order);
    } catch (err: any) {
      console.error("Tracking error:", err);
      setError(err.message);
      setTrackingOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.weight === 0 && formData.blankets === 0) {
      setError('Please add some items to your order');
      return;
    }
    if (formData.lat === 0) {
      setError('Please select your location on the map');
      return;
    }

    setLoading(true);
    setError('');
    
    const timestamp = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const totalPrice = calculatePrice(formData.weight, formData.blankets);

    const orderData = {
      id: "BBL-" + timestamp.toUpperCase(),
      user_id: user?.id,
      customer_name: formData.name,
      phone: formData.phone,
      address: formData.address,
      lat: formData.lat,
      lng: formData.lng,
      clothes_weight: formData.weight,
      blankets_count: formData.blankets,
      total_price: totalPrice
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to place order');
      }

      const result = await response.json();
      const id = orderData.id;

      const newOrder: Order = {
        ...orderData,
        status: 'Pending',
        created_at: new Date().toISOString()
      };

      setOrderHistory([newOrder, ...orderHistory]);
      setOrderId(id);
      setShowSuccessModal(true);
      
      setFormData({ 
        name: user?.name || '', 
        phone: user?.phone || '', 
        address: user?.address || '', 
        weight: 0, 
        blankets: 0, 
        lat: user?.lat || 0, 
        lng: user?.lng || 0,
        location_name: user?.location_name || ''
      });
    } catch (err: any) {
      console.error("Order error:", err);
      setError(err.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  const statusSteps: OrderStatus[] = ['Pending', 'Picked Up', 'Washing', 'Drying', 'Ready for Delivery', 'Delivered'];
  const getStatusIndex = (status: OrderStatus) => statusSteps.indexOf(status);

  return (
    <div className="min-h-screen font-sans">
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                <BubblesIcon className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-display font-bold dark:text-white">Order Received!</h3>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Your order <span className="font-bold text-sky-600 dark:text-sky-400">#{orderId}</span> has been placed successfully. bubbletz will pick up your laundry soon!
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  setView('track');
                  handleTrack();
                }}
                className="w-full bg-sky-600 text-white py-4 rounded-2xl font-bold hover:bg-sky-700 transition-all shadow-lg shadow-sky-200 dark:shadow-sky-900/20"
              >
                Track My Order
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => { setView('home'); setTrackingOrder(null); }}
          >
            <div className="bg-sky-500 p-2 rounded-xl shadow-lg shadow-sky-200 dark:shadow-sky-900/20">
              <BubblesIcon className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-zinc-900 dark:text-white uppercase">bubbletz</h1>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {user ? (
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setView('history')}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    view === 'history' ? "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                  title="History"
                >
                  <History className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    setAuthForm({
                      ...authForm,
                      name: user.name || '',
                      username: user.username || '',
                      email: user.email || '',
                      phone: user.phone || '',
                      is_whatsapp: !!user.is_whatsapp,
                      address: user.address || '',
                      lat: user.lat || 0,
                      lng: user.lng || 0,
                      location_name: user.location_name || ''
                    });
                    setView('settings');
                  }}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    view === 'settings' ? "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setView('auth')}
                className="flex items-center gap-2 bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400 px-4 py-2 rounded-xl font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
              >
                <User className="w-4 h-4" />
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <section className="relative overflow-hidden rounded-3xl bg-sky-600 dark:bg-sky-700 p-8 text-white">
                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                    <MapPin className="w-4 h-4" />
                    {user?.location_name || 'Dar es Salaam, Tanzania'}
                  </div>
                  <h2 className="text-4xl font-display font-bold leading-tight">
                    {user ? `Hello, ${user.name}!` : 'Laundry made easy,'} <br />
                    {user ? 'Ready for a clean wash?' : 'with bubbletz at your door.'}
                  </h2>
                  <p className="text-sky-50 opacity-90 max-w-md">
                    Premium washing, drying, and folding service. We pick up and deliver anywhere in Dar es Salaam.
                  </p>
                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setView('order')}
                      className="bg-white text-sky-600 px-6 py-3 rounded-2xl font-bold shadow-xl hover:bg-sky-50 transition-colors"
                    >
                      Order Pickup
                    </button>
                    <button 
                      onClick={() => setView('track')}
                      className="bg-sky-700 text-white px-6 py-3 rounded-2xl font-bold hover:bg-sky-800 transition-colors"
                    >
                      Track Order
                    </button>
                  </div>
                </div>
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-48 h-48 bg-sky-400/20 rounded-full blur-2xl" />
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl">
                      <Package className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                    </div>
                    {saturday && (
                      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                        Saturday Special
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1 dark:text-white">Normal Clothes</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">Per kilogram. Includes wash, dry, and fold.</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display font-bold dark:text-white">
                      ${saturday ? PRICING.NORMAL.SATURDAY : PRICING.NORMAL.REGULAR}
                    </span>
                    <span className="text-zinc-400">/kg</span>
                    {!saturday && (
                      <span className="text-zinc-400 line-through text-sm ml-2">${PRICING.NORMAL.REGULAR}</span>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-2xl">
                      <History className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
                    </div>
                    {saturday && (
                      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                        Saturday Special
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1 dark:text-white">Blankets</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">Per item. Deep clean and sanitization.</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display font-bold dark:text-white">
                      ${saturday ? PRICING.BLANKET.SATURDAY : PRICING.BLANKET.REGULAR}
                    </span>
                    <span className="text-zinc-400">/each</span>
                  </div>
                </div>
              </section>

              <section className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-3xl p-6 flex items-center gap-4">
                <div className="bg-amber-100 dark:bg-amber-900/20 p-3 rounded-2xl">
                  <Calendar className="text-amber-600 dark:text-amber-400 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-100">Saturday Discount Day!</h4>
                  <p className="text-amber-700 dark:text-amber-300 text-sm">Save up to 40% every Saturday. Normal clothes at $1.50/kg and blankets at $4.00.</p>
                </div>
              </section>
            </motion.div>
          )}

          {view === 'order' && (
            <motion.div 
              key="order"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={() => setView('home')}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6 rotate-180 dark:text-zinc-400" />
                </button>
                <h2 className="text-2xl font-display font-bold dark:text-white">Place Your Order</h2>
              </div>

              <form onSubmit={handlePlaceOrder} className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                    <Info className="w-5 h-5 text-sky-500" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Full Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Phone Number</label>
                      <input 
                        required
                        type="tel" 
                        placeholder="07 ....."
                        className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Pickup Address</label>
                    <textarea 
                      required
                      placeholder="Kariakoo, Dar es Salaam..."
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all h-24 resize-none"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                    <Package className="w-5 h-5 text-sky-500" />
                    Order Details
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl">
                      <div>
                        <h4 className="font-bold dark:text-white">Normal Clothes</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Estimated weight in KG</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, weight: Math.max(0, formData.weight - 0.5)})}
                          className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:text-white"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-display font-bold text-lg dark:text-white">{formData.weight}</span>
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, weight: formData.weight + 0.5})}
                          className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl">
                      <div>
                        <h4 className="font-bold dark:text-white">Blankets</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Number of items</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, blankets: Math.max(0, formData.blankets - 1)})}
                          className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:text-white"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-display font-bold text-lg dark:text-white">{formData.blankets}</span>
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, blankets: formData.blankets + 1})}
                          className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                    <MapPin className="w-5 h-5 text-sky-500" />
                    Pickup Location
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Your saved location is pinned. Tap to update for this order.</p>
                  <MapPicker 
                    initialPos={(formData.lat && formData.lng) ? [formData.lat, formData.lng] : undefined}
                    onLocationSelect={(lat, lng, name) => setFormData({...formData, lat, lng, location_name: name || ''})} 
                  />
                  {formData.location_name && (
                    <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">Detected: {formData.location_name}</p>
                  )}
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="sticky bottom-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Estimated Total</p>
                    <p className="text-3xl font-display font-bold text-sky-600 dark:text-sky-400">
                      ${calculatePrice(formData.weight, formData.blankets).toFixed(2)}
                    </p>
                  </div>
                  <button 
                    disabled={loading}
                    className="bg-sky-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-200 dark:shadow-sky-900/20"
                  >
                    {loading ? 'Processing...' : 'Confirm Pickup'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {view === 'auth' && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-display font-bold dark:text-white">
                    {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    {authMode === 'login' ? 'Login to access your order history' : 'Sign up to start ordering laundry service'}
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {authMode === 'signup' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Full Name</label>
                          <input 
                            required
                            type="text" 
                            placeholder="John Doe"
                            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                            value={authForm.name}
                            onChange={e => setAuthForm({...authForm, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Username</label>
                          <input 
                            required
                            type="text" 
                            placeholder="johndoe123"
                            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                            value={authForm.username}
                            onChange={e => setAuthForm({...authForm, username: e.target.value})}
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Email Address</label>
                      <input 
                        required
                        type="email" 
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        value={authForm.email}
                        onChange={e => setAuthForm({...authForm, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Password</label>
                      <input 
                        required
                        type="password" 
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        value={authForm.password}
                        onChange={e => setAuthForm({...authForm, password: e.target.value})}
                      />
                    </div>
                    {authMode === 'signup' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Phone Number</label>
                          <input 
                            required
                            type="tel" 
                            placeholder="+255..."
                            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                            value={authForm.phone}
                            onChange={e => setAuthForm({...authForm, phone: e.target.value})}
                          />
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3 mt-5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                          <input 
                            type="checkbox" 
                            id="whatsapp"
                            className="w-5 h-5 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                            checked={authForm.is_whatsapp}
                            onChange={e => setAuthForm({...authForm, is_whatsapp: e.target.checked})}
                          />
                          <label htmlFor="whatsapp" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                            I'm available on WhatsApp
                          </label>
                        </div>
                      </>
                    )}
                  </div>

                  {authMode === 'signup' && (
                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Default Pickup Address</label>
                        <textarea 
                          required
                          placeholder="Your street address, suburb, etc."
                          className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all h-20 resize-none"
                          value={authForm.address}
                          onChange={e => setAuthForm({...authForm, address: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Set Your Location on Map</label>
                        <MapPicker 
                          onLocationSelect={(lat, lng, name) => setAuthForm({...authForm, lat, lng, location_name: name || ''})} 
                        />
                        {authForm.location_name && (
                          <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">Detected: {authForm.location_name}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

                  <button 
                    disabled={loading}
                    className="w-full bg-sky-600 text-white py-4 rounded-2xl font-bold hover:bg-sky-700 transition-all disabled:opacity-50 shadow-lg shadow-sky-200 dark:shadow-sky-900/20"
                  >
                    {loading ? 'Processing...' : authMode === 'login' ? 'Login' : 'Sign Up'}
                  </button>
                </form>

                <div className="text-center">
                  <button 
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  >
                    {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={() => setView('home')}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6 rotate-180 dark:text-zinc-400" />
                </button>
                <h2 className="text-2xl font-display font-bold dark:text-white">Profile Settings</h2>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                <div className="flex items-center gap-4 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-100 dark:border-sky-900/30">
                  <div className="bg-sky-500 p-3 rounded-full text-white">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold dark:text-white">{user?.name}</h3>
                    <p className="text-xs text-sky-600 dark:text-sky-400 font-mono">ID: {user?.id}</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Full Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none"
                        value={authForm.name}
                        onChange={e => setAuthForm({...authForm, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Username</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none"
                        value={authForm.username}
                        onChange={e => setAuthForm({...authForm, username: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Email</label>
                      <input 
                        required
                        type="email" 
                        className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none"
                        value={authForm.email}
                        onChange={e => setAuthForm({...authForm, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Phone</label>
                      <input 
                        required
                        type="tel" 
                        className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none"
                        value={authForm.phone}
                        onChange={e => setAuthForm({...authForm, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <input 
                      type="checkbox" 
                      id="settings_whatsapp"
                      className="w-5 h-5 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                      checked={authForm.is_whatsapp}
                      onChange={e => setAuthForm({...authForm, is_whatsapp: e.target.checked})}
                    />
                    <label htmlFor="settings_whatsapp" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      I'm available on WhatsApp
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Default Pickup Address</label>
                    <textarea 
                      required
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none h-20 resize-none"
                      value={authForm.address}
                      onChange={e => setAuthForm({...authForm, address: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Update Your Saved Location</label>
                    <MapPicker 
                      initialPos={(user?.lat && user?.lng) ? [user.lat, user.lng] : undefined}
                      onLocationSelect={(lat, lng, name) => setAuthForm({...authForm, lat, lng, location_name: name || ''})} 
                    />
                    {authForm.location_name && (
                      <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">Detected: {authForm.location_name}</p>
                    )}
                  </div>

                  <button 
                    className="w-full bg-sky-600 text-white py-4 rounded-2xl font-bold hover:bg-sky-700 transition-all shadow-lg shadow-sky-200 dark:shadow-sky-900/20"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={() => setView('home')}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6 rotate-180 dark:text-zinc-400" />
                </button>
                <h2 className="text-2xl font-display font-bold dark:text-white">Order History</h2>
              </div>

              {orderHistory.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center space-y-4">
                  <div className="bg-zinc-50 dark:bg-zinc-950 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <History className="text-zinc-300 dark:text-zinc-700 w-8 h-8" />
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400">No recent orders found.</p>
                  <button 
                    onClick={() => setView('order')}
                    className="text-sky-600 dark:text-sky-400 font-bold hover:underline"
                  >
                    Place your first order
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orderHistory.map(order => (
                    <button
                      key={order.id}
                      onClick={() => {
                        setOrderId(order.id);
                        setView('track');
                        handleTrack();
                      }}
                      className="w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:border-sky-500 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-sky-50 dark:bg-sky-900/20 p-2 rounded-xl group-hover:bg-sky-100 dark:group-hover:bg-sky-900/40 transition-colors">
                          <Package className="text-sky-600 dark:text-sky-400 w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-zinc-900 dark:text-white">{order.id}</p>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase",
                              order.status === 'Cancelled' ? "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400" : "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400"
                            )}>
                              {order.status}
                            </span>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-700 group-hover:text-sky-500 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'track' && (
            <motion.div 
              key="track"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={() => { setView('home'); setTrackingOrder(null); }}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6 rotate-180 dark:text-zinc-400" />
                </button>
                <h2 className="text-2xl font-display font-bold dark:text-white">Track Order</h2>
              </div>

              {!trackingOrder ? (
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center space-y-6">
                  <div className="bg-zinc-50 dark:bg-zinc-950 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <Search className="text-zinc-400 dark:text-zinc-600 w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold dark:text-white">Find your order</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Enter the order ID provided during checkout to track its status.</p>
                  </div>
                  <form onSubmit={handleTrack} className="flex gap-2 max-w-sm mx-auto">
                    <input 
                      type="text" 
                      placeholder="BBL-XXXXXX"
                      className="flex-1 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                      value={orderId}
                      onChange={e => setOrderId(e.target.value.toUpperCase())}
                    />
                    <button 
                      disabled={loading}
                      className="bg-sky-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-sky-700 transition-colors disabled:opacity-50"
                    >
                      Track
                    </button>
                  </form>
                  {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Order ID</p>
                        <h3 className="text-xl font-display font-bold dark:text-white">{trackingOrder.id}</h3>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-sm font-bold",
                        trackingOrder.status === 'Cancelled' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400"
                      )}>
                        {trackingOrder.status}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Items</p>
                        <p className="text-sm font-medium dark:text-zinc-200">
                          {trackingOrder.clothes_weight}kg Clothes, {trackingOrder.blankets_count} Blankets
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Total Paid</p>
                        <p className="text-sm font-bold text-sky-600 dark:text-sky-400">${trackingOrder.total_price.toFixed(2)}</p>
                      </div>
                    </div>
                    {trackingOrder.status === 'Pending' && (
                      <button 
                        onClick={() => handleCancelOrder(trackingOrder.id)}
                        className="w-full mt-4 flex items-center justify-center gap-2 py-3 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Order
                      </button>
                    )}
                  </div>

                  {trackingOrder.status !== 'Cancelled' ? (
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                      <h3 className="font-bold mb-8 dark:text-white">Order Status</h3>
                      <div className="space-y-8 relative">
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-zinc-100 dark:bg-zinc-800" />
                        
                        {statusSteps.map((step, idx) => {
                          const isCompleted = getStatusIndex(trackingOrder.status) >= idx;
                          const isCurrent = trackingOrder.status === step;
                          
                          return (
                            <div key={step} className="flex items-center gap-6 relative z-10">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                                isCompleted ? "bg-sky-500 border-sky-500 text-white" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700",
                                isCurrent && "ring-4 ring-sky-100 dark:ring-sky-900/30"
                              )}>
                                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                              </div>
                              <div>
                                <p className={cn(
                                  "font-bold transition-colors",
                                  isCompleted ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-600"
                                )}>
                                  {step}
                                </p>
                                {isCurrent && (
                                  <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">Your order is currently here</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl border border-red-100 dark:border-red-900/30 shadow-sm text-center space-y-4">
                      <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <XCircle className="text-red-400 w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Order Cancelled</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm">This order has been cancelled and will not be processed.</p>
                    </div>
                  )}

                  <button 
                    onClick={() => setTrackingOrder(null)}
                    className="w-full py-4 text-zinc-500 dark:text-zinc-400 font-bold hover:text-zinc-900 dark:hover:white transition-colors"
                  >
                    Track another order
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-zinc-900 dark:bg-black text-white p-8 pb-12 transition-colors">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BubblesIcon className="text-sky-400 w-6 h-6" />
              <h2 className="text-xl font-display font-bold uppercase tracking-widest">bubbletz</h2>
            </div>
            <p className="text-zinc-400 text-sm max-w-xs">
              Dar es Salaam's most reliable laundry service. We take care of your clothes so you can take care of your life.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500">Contact Us</h3>
            <div className="space-y-2">
              <a href="tel:+255000000000" className="flex items-center gap-2 text-zinc-300 hover:text-sky-400 transition-colors">
                <Phone className="w-4 h-4" />
                +255 000 000 000
              </a>
              <div className="flex items-center gap-2 text-zinc-300">
                <MapPin className="w-4 h-4" />
                Unit L, Dar es Salaam, Tanzania
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-zinc-500 text-xs">
          © {new Date().getFullYear()} bubbletz Laundry Service. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
