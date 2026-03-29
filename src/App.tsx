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
  Map as MapIcon,
  Bell,
  Mail,
  Edit,
  RefreshCw,
  FileText,
  ShieldCheck,
  Smartphone,
  Check
} from 'lucide-react';
import { io } from 'socket.io-client';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import ReloadPrompt from './components/ReloadPrompt';
import MapPicker from './components/MapPicker';
import LandingPage from './components/LandingPage';
import { Skeleton, OrderSkeleton, TrackingSkeleton } from './components/Skeleton';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SuccessAnimation } from './components/SuccessAnimation';
import { OnboardingGuide } from './components/OnboardingGuide';
import { SupportChat } from './components/SupportChat';
import { calculatePrice, isPromotionDay, PRICING, getApiUrl, API_BASE_URL } from './constants';
import { cn } from './cn';

const BubblesIcon = ({ className }: { className?: string }) => (
  <img 
    src="/images/logo.png" 
    alt="bubbletz logo" 
    className={cn("object-contain", className)}
  />
);

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

function NotificationToast({ notification, onDismiss }: { notification: AppNotification, onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xl flex items-start gap-3 w-80 mb-3 pointer-events-auto"
    >
      <div className={cn(
        "p-2 rounded-xl mt-0.5",
        notification.type === 'success' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
        notification.type === 'warning' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
        "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
      )}>
        <Bell className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold dark:text-white truncate">{notification.title}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">{notification.message}</p>
      </div>
      <button onClick={() => onDismiss(notification.id)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
        <XCircle className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export const hapticClick = async () => {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (e) {
    // Fallback for browser
  }
};

const hapticSuccess = async () => {
  try {
    await Haptics.notification({ type: 'SUCCESS' as any });
  } catch (e) {
    // Fallback for browser
  }
};

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
      document.body.classList.add('dark');
      localStorage.setItem('bubbletz_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('bubbletz_theme', 'light');
    }
  }, [darkMode]);

  const [user, setUser] = useState<UserData | null>(() => {
    try {
      const saved = localStorage.getItem('bubbletz_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return (parsed && typeof parsed === 'object' && parsed.id) ? parsed : null;
    } catch (err) {
      console.error("Failed to parse user from localStorage", err);
      return null;
    }
  });

  const [view, setView] = useState<'landing' | 'home' | 'order' | 'track' | 'history' | 'auth' | 'settings'>(() => {
    return user ? 'home' : 'landing';
  });

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'recover'>('login');
  const [recoveryPassword, setRecoveryPassword] = useState('');
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
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSuccessAnimationDone, setIsSuccessAnimationDone] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('bubbletz_onboarded'));
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState<Order | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifSettings, setNotifSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('bubbletz_notif_settings');
      return saved ? JSON.parse(saved) : { push: true, email: true, whatsapp: true };
    } catch {
      return { push: true, email: true, whatsapp: true };
    }
  });

  useEffect(() => {
    localStorage.setItem('bubbletz_notif_settings', JSON.stringify(notifSettings));
  }, [notifSettings]);

  const addNotification = (title: string, message: string, type: AppNotification['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, title, message, type }, ...prev]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Real-time WebSocket connection for status updates
  useEffect(() => {
    if (!user) return;

    const socket = io(API_BASE_URL);

    socket.on("connect", () => {
      console.log("Connected to WebSocket");
      socket.emit("join", user.id);
    });

    socket.on("order_status_update", (data: { orderId: string, status: OrderStatus, message: string }) => {
      setOrderHistory(prev => prev.map(o => 
        o.id === data.orderId ? { ...o, status: data.status } : o
      ));

      if (trackingOrder && trackingOrder.id === data.orderId) {
        setTrackingOrder(prev => prev ? { ...prev, status: data.status } : null);
      }

      addNotification('Order Updated', data.message, 'success');
    });

    return () => {
      socket.disconnect();
    };
  }, [user, trackingOrder?.id]);

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

  const isWeekend = isPromotionDay();
  useEffect(() => {
    if (user) {
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

  const fetchUserHistory = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/orders/user/${user.id}`));
      if (response.ok) {
        const orders = await response.json();
        setOrderHistory(orders);

        if (trackingOrder) {
          const updated = orders.find((o: Order) => o.id === trackingOrder.id);
          if (updated && updated.status !== trackingOrder.status) {
            setTrackingOrder(updated);
            addNotification('Status Update', `Order ${updated.id} is now ${updated.status}!`, 'success');
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    hapticClick();
    setIsRefreshing(true);
    await fetchUserHistory(true);
    hapticSuccess();
  };

  useEffect(() => {
    if (!user) return;
    const poll = () => {
      if (document.visibilityState === 'visible') {
        fetchUserHistory();
      }
    };
    poll();
    const pollingInterval = setInterval(poll, 1000); 
    return () => clearInterval(pollingInterval);
  }, [user, trackingOrder?.id, trackingOrder?.status]); 

  const syncToSupabase = async (userData: UserData) => {
    localStorage.setItem('bubbletz_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRecoveryPassword('');

    if (authMode === 'signup' && authForm.lat === 0) {
      setError('Please select your location on the map');
      setLoading(false);
      return;
    }

    try {
      if (authMode === 'recover') {
        const response = await fetch(getApiUrl('/api/recover-password'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authForm.email }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Recovery failed');
        }

        const data = await response.json();
        setRecoveryPassword(data.password);
        return;
      }

      const endpoint = authMode === 'signup' ? '/api/signup' : '/api/login';
      const response = await fetch(getApiUrl(endpoint), {
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
    localStorage.removeItem('bubbletz_user');
    setUser(null);
    setView('landing');
    hapticClick();
  };

  const handleCancelOrder = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/orders/${id}/cancel`), { method: 'POST' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel order');
      }
      setOrderHistory(prev => prev.map(o => o.id === id ? { ...o, status: 'Cancelled' } : o));
      if (trackingOrder && trackingOrder.id === id) {
        setTrackingOrder({ ...trackingOrder, status: 'Cancelled' });
      }
      addNotification('Order Cancelled', `Order ${id} has been cancelled.`, 'info');
      hapticClick();
    } catch (err: any) {
      console.error("Cancel error:", err);
      setError(err.message);
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
      const response = await fetch(getApiUrl(`/api/orders/${orderId}`));
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
    const generatedId = editingOrder ? editingOrder.id : "BBL-" + timestamp.toUpperCase();

    if (!editingOrder) {
      setOrderId(generatedId);
      setIsSuccessAnimationDone(false);
      setShowSuccessModal(true);
      hapticClick();
    }

    const orderData = {
      id: generatedId,
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
      const endpoint = editingOrder ? `/api/orders/${editingOrder.id}/update` : '/api/orders';
      const response = await fetch(getApiUrl(endpoint), {
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

      if (editingOrder) {
        const updatedOrder = {
          ...editingOrder,
          ...orderData,
        };
        setOrderHistory(prev => prev.map(o => o.id === editingOrder.id ? updatedOrder : o));
        setEditingOrder(null);
        setLoading(false);
        alert('Order updated successfully!');
        setView('home');
      } else {
        const newOrder: Order = {
          ...orderData,
          status: 'Pending',
          created_at: new Date().toISOString()
        };

        setOrderHistory(prev => [newOrder, ...prev]);

        // Wait for the animation to feel natural
        setTimeout(() => {
          setIsSuccessAnimationDone(true);
          hapticSuccess();
        }, 2000);
      }
    } catch (err: any) {
      console.error("Order error:", err);
      setError(err.message || "Failed to place order.");
      setShowSuccessModal(false);
      setLoading(false);
    }
    };  const statusSteps: OrderStatus[] = ['Pending', 'Picked Up', 'Washing', 'Drying', 'Ready for Delivery', 'Delivered'];
  const getStatusIndex = (status: OrderStatus) => statusSteps.indexOf(status);

  const NavButton = ({ target, icon: Icon, label }: { target: any, icon: any, label: string }) => {
    const isActive = view === target;
    return (
      <button 
        onClick={() => { hapticClick(); setView(target); }}
        className={cn(
          "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all duration-300",
          isActive ? "text-sky-600 scale-105" : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        )}
      >
        <div className={cn(
          "p-1.5 rounded-xl transition-colors",
          isActive ? "bg-sky-50 dark:bg-sky-900/20" : "bg-transparent"
        )}>
          <Icon className={cn("w-6 h-6", isActive ? "fill-current" : "stroke-[1.5px]")} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen font-sans bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500">
      <ReloadPrompt />
      
      <div className="fixed top-24 right-4 z-[100] pointer-events-none flex flex-col items-end">
        <AnimatePresence>
          {notifications.map(n => (
            <NotificationToast key={n.id} notification={n} onDismiss={dismissNotification} />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-8"
            >
              <SuccessAnimation isDone={isSuccessAnimationDone} />

              <div className="space-y-4">
                <h3 className="text-3xl font-display font-bold dark:text-white leading-tight">
                  {isSuccessAnimationDone ? "Order Placed!" : "Placing Order..."}
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">
                  {isSuccessAnimationDone 
                    ? `Your order #${orderId} is in safe hands. We'll be there soon!`
                    : "Wait while we confirm your pickup request..."
                  }
                </p>
              </div>

              {isSuccessAnimationDone && (
                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    onClick={() => { 
                      hapticClick(); 
                      setShowSuccessModal(false); 
                      setView('track'); 
                      handleTrack(); 
                      setLoading(false);
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
                    }}
                    className="w-full bg-sky-600 text-white py-4 rounded-2xl font-bold hover:bg-sky-700 active:scale-95 transition-all shadow-lg shadow-sky-200 dark:shadow-sky-900/20"
                  >
                    Track My Order
                  </button>
                  <button 
                    onClick={() => { 
                      hapticClick(); 
                      setShowSuccessModal(false); 
                      setView('home'); 
                      setLoading(false);
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
                    }}
                    className="w-full py-3 text-zinc-500 font-bold hover:text-zinc-700 dark:hover:text-zinc-300 text-sm"
                  >
                    Go Back Home
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}      </AnimatePresence>

      {view !== 'landing' && view !== 'auth' && (
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 px-6 py-4 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => { hapticClick(); setView('home'); setTrackingOrder(null); }}
            >
              <BubblesIcon className="w-9 h-9 drop-shadow-md group-active:scale-90 transition-transform" />
              <div>
                <h1 className="text-xl font-display font-bold tracking-tight text-zinc-900 dark:text-white uppercase leading-none">bubbletz</h1>
                <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mt-0.5">Laundry Service</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { hapticClick(); setDarkMode(!darkMode); }}
                className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:scale-105 active:scale-90 transition-all border border-zinc-200/50 dark:border-zinc-800/50"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {!user && (
                <button 
                  onClick={() => { hapticClick(); setView('auth'); }}
                  className="bg-sky-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-sky-200 dark:shadow-sky-900/20 active:scale-95 transition-all"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      <main className="max-w-4xl mx-auto p-4 pb-32">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
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
                      onClick={() => { hapticClick(); setView('order'); }}
                      className="bg-white text-sky-600 px-6 py-3 rounded-2xl font-bold shadow-xl hover:bg-sky-50 transition-colors"
                    >
                      Order Pickup
                    </button>
                    <button 
                      onClick={() => { hapticClick(); setView('history'); }}
                      className="bg-sky-700 text-white px-6 py-3 rounded-2xl font-bold hover:bg-sky-800 transition-colors"
                    >
                      Track Order
                    </button>
                  </div>
                </div>
                <BubblesIcon className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 opacity-20 blur-sm" />
                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-48 h-48 bg-sky-400/20 rounded-full blur-2xl" />
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl">
                      <Package className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                    </div>
                    {isWeekend && (
                      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                        Weekend Special
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1 dark:text-white">Normal Clothes</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">Per kilogram. Includes wash, dry, and fold.</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-display font-bold dark:text-white">
                      TSh {(isWeekend ? PRICING.NORMAL.SATURDAY : PRICING.NORMAL.REGULAR).toLocaleString()}
                    </span>
                    <span className="text-zinc-400">/kg</span>
                    {isWeekend && (
                      <span className="text-zinc-400 line-through text-sm ml-2">TSh {PRICING.NORMAL.REGULAR.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-2xl">
                      <History className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
                    </div>
                    {isWeekend && (
                      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                        Weekend Special
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1 dark:text-white">Blankets</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">Per item. Deep clean and sanitization.</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-display font-bold dark:text-white">
                      TSh {(isWeekend ? PRICING.BLANKET.SATURDAY : PRICING.BLANKET.REGULAR).toLocaleString()}
                    </span>
                    <span className="text-zinc-400">/each</span>
                    {isWeekend && (
                      <span className="text-zinc-400 line-through text-sm ml-2">TSh {PRICING.BLANKET.REGULAR.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </section>

              {isWeekend && (
                <section className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-3xl p-6 flex items-center gap-4">
                  <div className="bg-amber-100 dark:bg-amber-900/20 p-3 rounded-2xl">
                    <Calendar className="text-amber-600 dark:text-amber-400 w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-900 dark:text-amber-100">Weekend & Weight Discounts!</h4>
                    <p className="text-amber-700 dark:text-amber-300 text-sm">Save 25% every Saturday and Sunday. Also get 2% off for every 10kg! Normal clothes at TSh {PRICING.NORMAL.SATURDAY.toLocaleString()}/kg and blankets at TSh {PRICING.BLANKET.SATURDAY.toLocaleString()}.</p>
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {view === 'order' && (
            <motion.div 
              key="order"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={() => { hapticClick(); setView('home'); }}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6 rotate-180 dark:text-zinc-400" />
                </button>
                <h2 className="text-2xl font-display font-bold dark:text-white">
                  {editingOrder ? 'Edit Your Order' : 'Place Your Order'}
                </h2>
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
                      <div className="relative">
                        <input 
                          required
                          type="text" 
                          placeholder="John Doe"
                          className={cn(
                            "w-full px-4 py-3 rounded-2xl border dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all",
                            formData.name.length > 2 ? "border-emerald-500/50 pr-10" : "border-zinc-200 dark:border-zinc-800"
                          )}
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                        {formData.name.length > 2 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Phone Number</label>
                      <div className="relative">
                        <input 
                          required
                          type="tel" 
                          placeholder="07 ....."
                          inputMode="tel"
                          className={cn(
                            "w-full px-4 py-3 rounded-2xl border dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all",
                            formData.phone.startsWith('0') && formData.phone.length >= 10 ? "border-emerald-500/50 pr-10" : "border-zinc-200 dark:border-zinc-800"
                          )}
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                        {formData.phone.startsWith('0') && formData.phone.length >= 10 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Pickup Address</label>
                    <div className="relative">
                      <textarea 
                        required
                        placeholder="Kariakoo, Dar es Salaam..."
                        className={cn(
                          "w-full px-4 py-3 rounded-2xl border dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all h-24 resize-none",
                          formData.address.length > 5 ? "border-emerald-500/50 pr-10" : "border-zinc-200 dark:border-zinc-800"
                        )}
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                      />
                      {formData.address.length > 5 && (
                        <div className="absolute right-3 top-4 text-emerald-500">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                    </div>
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
                          onClick={() => { hapticClick(); setFormData({...formData, weight: Math.max(0, formData.weight - 0.5)}); }}
                          className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:text-white"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-display font-bold text-lg dark:text-white">{formData.weight}</span>
                        <button 
                          type="button"
                          onClick={() => { hapticClick(); setFormData({...formData, weight: formData.weight + 0.5}); }}
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
                          onClick={() => { hapticClick(); setFormData({...formData, blankets: Math.max(0, formData.blankets - 1)}); }}
                          className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:text-white"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-display font-bold text-lg dark:text-white">{formData.blankets}</span>
                        <button 
                          type="button"
                          onClick={() => { hapticClick(); setFormData({...formData, blankets: formData.blankets + 1}); }}
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
                  <MapPicker
                    initialPos={(formData.lat && formData.lng) ? [formData.lat, formData.lng] : undefined}
                    onLocationSelect={(lat, lng, name) => setFormData(prev => ({ 
                      ...prev, 
                      lat, 
                      lng, 
                      location_name: name || '',
                      address: name || prev.address 
                    }))}
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

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Estimated Total</p>
                    <p className="text-3xl font-display font-bold text-sky-600 dark:text-sky-400">
                      TSh {calculatePrice(formData.weight, formData.blankets)}
                    </p>
                  </div>
                  <button 
                    disabled={loading}
                    type="submit"
                    onClick={() => !loading && hapticClick()}
                    className="bg-sky-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-sky-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-200 dark:shadow-sky-900/20"
                  >
                    Confirm Pickup
                  </button>
                </div>
              </form>
            </motion.div>
          )}

            {view === 'landing' && (
              <LandingPage 
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
                onGetStarted={() => { setAuthMode('signup'); setView('auth'); hapticClick(); }}
                onLogin={() => { setAuthMode('login'); setView('auth'); hapticClick(); }}
              />
            )}

            {view === 'auth' && (
              <motion.div 
                key="auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="max-w-xl mx-auto"
              >
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                <div className="text-center space-y-2 relative">
                  <h2 className="text-2xl font-display font-bold dark:text-white">
                    {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Create Account' : 'Recover Password'}
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    {authMode === 'login' ? 'Login to access your order history' : authMode === 'signup' ? 'Sign up to start ordering laundry service' : 'Enter your email to recover your password'}
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  <div className={`grid grid-cols-1 ${authMode === 'signup' ? 'md:grid-cols-2' : ''} gap-4`}>
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
                        inputMode="email"
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        value={authForm.email}
                        onChange={e => setAuthForm({...authForm, email: e.target.value})}
                      />
                    </div>
                    {authMode !== 'recover' && (
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
                    )}
                    {authMode === 'signup' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Phone Number</label>
                          <input 
                            required
                            type="tel" 
                            inputMode="tel"
                            placeholder="Phone number..."
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
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                          <MapPin className="w-4 h-4" />
                          <label className="text-sm font-bold uppercase tracking-wider">Pin Your Location (Required)</label>
                        </div>
                        <div className="rounded-2xl overflow-hidden border-2 border-sky-100 dark:border-sky-900/30 shadow-inner">
                          <MapPicker
                            initialPos={(authForm.lat && authForm.lng) ? [authForm.lat, authForm.lng] : undefined}
                            onLocationSelect={(lat, lng, name) => setAuthForm(prev => ({ 
                              ...prev, 
                              lat, 
                              lng, 
                              location_name: name || '',
                              address: name || prev.address
                            }))}
                          />
                        </div>

                        {authForm.location_name && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg">
                            Selected: {authForm.location_name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {error && <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20">{error}</p>}
                  
                  {recoveryPassword && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 space-y-2">
                      <p className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">Password found!</p>
                      <p className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">{recoveryPassword}</p>
                      <button 
                        type="button"
                        onClick={() => { setAuthMode('login'); setRecoveryPassword(''); }}
                        className="text-xs text-emerald-700 dark:text-emerald-400 underline"
                      >
                        Back to Login
                      </button>
                    </div>
                  )}

                  <button 
                    disabled={loading}
                    type="submit"
                    onClick={() => hapticClick()}
                    className="w-full bg-sky-600 text-white py-4 rounded-2xl font-bold hover:bg-sky-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-sky-200 dark:shadow-sky-900/20"
                  >
                    {loading ? 'Processing...' : authMode === 'login' ? 'Login' : authMode === 'signup' ? 'Sign Up' : 'Recover Password'}
                  </button>
                </form>

                <div className="flex flex-col gap-3 text-center">
                  <button 
                    onClick={() => { hapticClick(); setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(''); setRecoveryPassword(''); }}
                    className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium"
                  >
                    {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                  </button>
                  
                  {authMode === 'login' && (
                    <button 
                      onClick={() => { hapticClick(); setAuthMode('recover'); setError(''); }}
                      className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                    >
                      Forgot your password?
                    </button>
                  )}
                  
                  {authMode === 'recover' && (
                    <button 
                      onClick={() => { hapticClick(); setAuthMode('login'); setError(''); setRecoveryPassword(''); }}
                      className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                    >
                      Back to Login
                    </button>
                  )}
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="max-w-xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={() => { hapticClick(); setView('home'); }}
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
                        inputMode="email"
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
                        inputMode="tel"
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
                      onLocationSelect={(lat, lng, name) => setAuthForm(prev => ({ 
                        ...prev, 
                        lat, 
                        lng, 
                        location_name: name || '',
                        address: name || prev.address
                      }))}
                    />

                  </div>

                  <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Notification Preferences</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                          <div className="bg-sky-100 dark:bg-sky-900/30 p-2 rounded-xl text-sky-600 dark:text-sky-400">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold dark:text-white">Push Notifications</p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Updates on order status</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { hapticClick(); setNotifSettings({ ...notifSettings, push: !notifSettings.push }); }}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            notifSettings.push ? "bg-sky-600" : "bg-zinc-300 dark:bg-zinc-700"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                            notifSettings.push ? "left-7" : "left-1"
                          )} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold dark:text-white">WhatsApp Updates</p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Direct updates via WhatsApp</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { hapticClick(); setNotifSettings({ ...notifSettings, whatsapp: !notifSettings.whatsapp }); }}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            notifSettings.whatsapp ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-700"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                            notifSettings.whatsapp ? "left-7" : "left-1"
                          )} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => hapticClick()}
                    className="w-full bg-sky-600 text-white py-4 rounded-2xl font-bold hover:bg-sky-700 active:scale-95 transition-all shadow-lg shadow-sky-200 dark:shadow-sky-900/20"
                  >
                    Save Changes
                  </button>

                  <button 
                    type="button"
                    onClick={() => { hapticClick(); setShowLogoutConfirm(true); }}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-4 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { hapticClick(); setView('home'); }}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 rotate-180 dark:text-zinc-400" />
                  </button>
                  <h2 className="text-2xl font-display font-bold dark:text-white">Order History</h2>
                </div>
                <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={cn(
                    "p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all",
                    isRefreshing && "animate-spin"
                  )}
                >
                  <RefreshCw className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {loading && orderHistory.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <OrderSkeleton key={i} />)}
                </div>
              ) : orderHistory.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center space-y-4">
                  <div className="bg-zinc-50 dark:bg-zinc-950 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <History className="text-zinc-300 dark:text-zinc-700 w-8 h-8" />
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400">No recent orders found.</p>
                  <button 
                    onClick={() => { hapticClick(); setView('order'); }}
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
                        hapticClick();
                        setOrderId(order.id);
                        setView('track');
                        handleTrack();
                      }}
                      className="w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:border-sky-500 active:scale-[0.98] transition-all group"
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={() => { hapticClick(); setView('home'); setTrackingOrder(null); }}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6 rotate-180 dark:text-zinc-400" />
                </button>
                <h2 className="text-2xl font-display font-bold dark:text-white">Track Order</h2>
              </div>

              {loading && !trackingOrder ? (
                <TrackingSkeleton />
              ) : !trackingOrder ? (
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center space-y-6">
                  <div className="bg-zinc-50 dark:bg-zinc-950 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <History className="text-zinc-400 dark:text-zinc-600 w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold dark:text-white">Track your orders</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Select an order from your history to see its current status.</p>
                  </div>
                  <button 
                    onClick={() => { hapticClick(); setView('history'); }}
                    className="bg-sky-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-sky-700 transition-colors mx-auto"
                  >
                    View Order History
                  </button>
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
                        <p className="text-sm font-bold text-sky-600 dark:text-sky-400">TSh {Math.round(trackingOrder.total_price)}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => { hapticClick(); setShowReceipt(trackingOrder); }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors mt-4"
                    >
                      <FileText className="w-4 h-4" />
                      View Detailed Receipt
                    </button>

                    {trackingOrder.status === 'Pending' && (
                      <div className="flex flex-col gap-2 mt-4">
                        <button 
                          onClick={() => { 
                            hapticClick(); 
                            setEditingOrder(trackingOrder);
                            setFormData({
                              name: trackingOrder.customer_name,
                              phone: trackingOrder.phone,
                              address: trackingOrder.address,
                              weight: trackingOrder.clothes_weight,
                              blankets: trackingOrder.blankets_count,
                              lat: trackingOrder.lat,
                              lng: trackingOrder.lng,
                              location_name: trackingOrder.address // Using address as location name if separate field not in Order
                            });
                            setView('order');
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-2xl font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Order
                        </button>
                        <button 
                          onClick={() => { hapticClick(); setShowCancelConfirm(trackingOrder.id); }}
                          className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel Order
                        </button>
                      </div>
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
                    onClick={() => { setTrackingOrder(null); setView('history'); }}
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

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200/50 dark:border-zinc-800/50 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <NavButton target="home" icon={Circle} label="Home" />
            <NavButton target="order" icon={Plus} label="New" />
            <NavButton target="history" icon={History} label="Orders" />
            <NavButton target="settings" icon={Settings} label="Profile" />
          </div>
        </nav>
      )}

      {view !== 'landing' && (
        <footer className="bg-zinc-900 dark:bg-black text-white p-8 pb-32 transition-colors">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BubblesIcon className="w-8 h-8" />
                <h2 className="text-xl font-display font-bold uppercase tracking-widest">bubbletz</h2>
              </div>
              <p className="text-zinc-400 text-sm max-w-xs">
                Dar es Salaam's most reliable laundry service. We take care of your clothes so you can take care of your life.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500">Contact Us</h3>
              <div className="space-y-2">
                <a href="mailto:bubblestzlaundry@gmail.com" className="flex items-center gap-2 text-zinc-300 hover:text-sky-400 transition-colors">
                  <Mail className="w-4 h-4" />
                  bubblestzlaundry@gmail.com
                </a>
                <div className="flex items-center gap-2 text-zinc-300">
                  <MapPin className="w-4 h-4" />
                  Dar es Salaam, Tanzania
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-zinc-500 text-xs">
            © {new Date().getFullYear()} REBI group. All rights reserved.
          </div>
        </footer>
      )}

      {/* New Components */}
      <SupportChat />

      <AnimatePresence>
        {showOnboarding && (
          <OnboardingGuide onComplete={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        variant="danger"
        title="Logout"
        message="Are you sure you want to logout? You'll need to login again to access your orders."
        confirmLabel="Logout"
      />

      <ConfirmationModal
        isOpen={!!showCancelConfirm}
        onClose={() => setShowCancelConfirm(null)}
        onConfirm={() => showCancelConfirm && handleCancelOrder(showCancelConfirm)}
        variant="danger"
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmLabel="Yes, Cancel Order"
      />

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReceipt(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="bg-sky-600 p-6 text-white text-center space-y-2">
                <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Order Receipt</h3>
                <p className="text-sky-100 text-xs font-mono uppercase tracking-widest">{showReceipt.id}</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Date</span>
                    <span className="font-bold dark:text-white">{new Date(showReceipt.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Status</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">{showReceipt.status}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-zinc-300">Normal Clothes ({showReceipt.clothes_weight}kg)</span>
                    <span className="font-bold dark:text-white">TSh {(showReceipt.clothes_weight * (isWeekend ? PRICING.NORMAL.SATURDAY : PRICING.NORMAL.REGULAR)).toLocaleString()}</span>
                  </div>
                  {showReceipt.blankets_count > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="dark:text-zinc-300">Blankets ({showReceipt.blankets_count})</span>
                      <span className="font-bold dark:text-white">TSh {(showReceipt.blankets_count * (isWeekend ? PRICING.BLANKET.SATURDAY : PRICING.BLANKET.REGULAR)).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl space-y-2 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-500 uppercase">Total Amount</span>
                    <span className="text-xl font-display font-bold text-sky-600 dark:text-sky-400">TSh {showReceipt.total_price.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowReceipt(null)}
                  className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold active:scale-95 transition-all"
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
