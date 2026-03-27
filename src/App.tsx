import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, 
  MapPin, 
  Package, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Phone,
  User,
  LogOut,
  XCircle,
  Sun,
  Moon,
  LayoutDashboard,
  Navigation,
  ArrowRight
} from 'lucide-react';
import MapPicker from './components/MapPicker';
import { isSaturday, DAR_ES_SALAAM_BOUNDS } from './constants';
import { cn } from './cn';

type OrderStatus = 'Pending' | 'Driver Assigned' | 'Picked Up' | 'At Shop' | 'Washing' | 'Drying' | 'Ready for Delivery' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'driver';
}

interface Shop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface Order {
  id: string;
  user_id: string;
  driver_id: string | null;
  shop_id: string | null;
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
    const saved = localStorage.getItem('bubbles_theme');
    return saved === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bubbles_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bubbles_theme', 'light');
    }
  }, [darkMode]);

  const [user, setUser] = useState<UserData | null>(() => {
    const saved = localStorage.getItem('bubbles_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState<'driver' | 'auth'>('driver');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', role: 'driver' as const });
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myDriverOrders, setMyDriverOrders] = useState<Order[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [driverFilter, setDriverFilter] = useState<'all' | 'pickup' | 'delivery'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const saturday = isSaturday();

  useEffect(() => {
    fetchDriverData();
  }, [user]);

  const fetchDriverData = async () => {
    try {
      const requests: Promise<Response>[] = [
        fetch('/api/driver/available-orders'),
        fetch('/api/shops')
      ];
      
      if (user && user.role === 'driver') {
        requests.push(fetch(`/api/driver/my-orders/${user.id}`));
      }

      const results = await Promise.all(requests);
      
      if (results[0].ok) setAvailableOrders(await results[0].json());
      if (results[1].ok) setShops(await results[1].json());
      if (results[2] && results[2].ok) setMyDriverOrders(await results[2].json());
    } catch (err) {
      console.error("Failed to fetch driver data", err);
    }
  };

  const acceptOrder = async (orderId: string) => {
    if (!user) {
      setAuthMode('signup');
      setAuthForm({ ...authForm, role: 'driver' });
      setView('auth');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/driver/accept-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, driverId: user.id })
      });
      if (res.ok) {
        fetchDriverData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to accept order');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, shopId?: string) => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/driver/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status, shopId, driverId: user.id })
      });
      if (res.ok) {
        fetchDriverData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update status');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const endpoint = authMode === 'login' ? '/api/login' : '/api/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auth failed');
      
      const userData = data.user || data; // Handle both login and signup response formats
      setUser(userData);
      localStorage.setItem('bubbles_user', JSON.stringify(userData));
      setView('driver');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bubbles_user');
    setView('driver');
  };

  return (
    <div className="min-h-screen font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => { setView('driver'); }}
          >
            <div className="bg-sky-500 p-2 rounded-xl shadow-lg shadow-sky-200 dark:shadow-sky-900/20">
              <Droplets className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-zinc-900 dark:text-white">BUBBLES</h1>
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
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setView('driver'); fetchDriverData(); }}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    view === 'driver' ? "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                >
                  <LayoutDashboard className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-full text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setAuthMode('signup');
                  setAuthForm({ ...authForm, role: 'driver' });
                  setView('auth');
                }}
                className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-sky-700 transition-colors shadow-md shadow-sky-100 dark:shadow-none"
              >
                <User className="w-4 h-4" />
                Join as Driver
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {view === 'driver' && (
            <motion.div 
              key="driver"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              {/* Driver Benefits / Intro for Guests */}
              {!user && (
                <div className="bg-sky-600 dark:bg-sky-700 rounded-3xl p-8 text-white space-y-6 shadow-xl shadow-sky-100 dark:shadow-none">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-display font-bold">Earn with BUBBLES</h2>
                    <p className="text-sky-100 opacity-90">Join Dar es Salaam's fastest growing laundry delivery network.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                      <Clock className="w-6 h-6 mb-2 text-sky-200" />
                      <p className="font-bold text-sm">Flexible Hours</p>
                      <p className="text-[10px] opacity-80">Work whenever you want. You are the boss.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                      <CheckCircle2 className="w-6 h-6 mb-2 text-sky-200" />
                      <p className="font-bold text-sm">Instant Payouts</p>
                      <p className="text-[10px] opacity-80">Get paid for every delivery you complete.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                      <Navigation className="w-6 h-6 mb-2 text-sky-200" />
                      <p className="font-bold text-sm">Smart Routing</p>
                      <p className="text-[10px] opacity-80">Optimized routes to save your fuel and time.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthForm({ ...authForm, role: 'driver' });
                      setView('auth');
                    }}
                    className="w-full bg-white text-sky-600 py-4 rounded-2xl font-bold shadow-lg hover:bg-sky-50 transition-colors flex items-center justify-center gap-2"
                  >
                    Start Working Now
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Map Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Live Map</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                      <span className="text-[10px] text-zinc-500 font-medium uppercase">Orders</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-[10px] text-zinc-500 font-medium uppercase">Shops</span>
                    </div>
                  </div>
                </div>
                <div className="h-[300px] rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner">
                  <MapPicker 
                    onLocationSelect={() => {}} 
                    initialPos={DAR_ES_SALAAM_BOUNDS.center}
                    markers={[
                      ...availableOrders.map(o => ({ id: o.id, lat: o.lat, lng: o.lng, title: o.customer_name, type: 'order' as const })),
                      ...shops.map(s => ({ id: s.id, lat: s.lat, lng: s.lng, title: s.name, type: 'shop' as const }))
                    ]}
                  />
                </div>
              </div>

              {/* Active Tasks - Only for Logged In Drivers */}
              {user && user.role === 'driver' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">My Active Tasks</h3>
                  {myDriverOrders.length === 0 ? (
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-8 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                      <p className="text-zinc-400 text-sm">No active tasks. Accept an order below!</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {myDriverOrders.map(order => (
                        <div key={order.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                order.status === 'Driver Assigned' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                order.status === 'Picked Up' ? "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400" :
                                "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                              )}>
                                {order.status}
                              </span>
                              <p className="font-bold text-lg dark:text-white">{order.customer_name}</p>
                              <p className="text-xs text-zinc-500">{order.address}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-sky-600">${order.total_price.toFixed(2)}</p>
                              <p className="text-[10px] text-zinc-400">{order.id}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            {order.status === 'Driver Assigned' && (
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'Picked Up')}
                                className="flex-1 bg-sky-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-sky-700 transition-colors"
                              >
                                Confirm Pickup
                              </button>
                            )}
                            {order.status === 'Picked Up' && (
                              <div className="w-full space-y-2">
                                <p className="text-xs font-bold text-zinc-500 uppercase">Deliver to Shop</p>
                                <div className="grid grid-cols-1 gap-2">
                                  {shops.map(shop => (
                                    <button 
                                      key={shop.id}
                                      onClick={() => updateOrderStatus(order.id, 'At Shop', shop.id)}
                                      className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-sky-500 transition-colors group"
                                    >
                                      <div className="text-left">
                                        <p className="text-sm font-bold dark:text-white group-hover:text-sky-600">{shop.name}</p>
                                        <p className="text-[10px] text-zinc-500">{shop.address}</p>
                                      </div>
                                      <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-sky-500" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {order.status === 'At Shop' && (
                              <div className="w-full space-y-2">
                                <p className="text-xs font-bold text-zinc-500 uppercase italic">Shop Processing Simulation</p>
                                <div className="grid grid-cols-3 gap-2">
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'Washing')}
                                    className="bg-zinc-100 dark:bg-zinc-800 py-2 rounded-lg text-[10px] font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                                  >
                                    Washing
                                  </button>
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'Drying')}
                                    className="bg-zinc-100 dark:bg-zinc-800 py-2 rounded-lg text-[10px] font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                                  >
                                    Drying
                                  </button>
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'Ready for Delivery')}
                                    className="bg-sky-100 dark:bg-sky-900/30 text-sky-600 py-2 rounded-lg text-[10px] font-bold hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors"
                                  >
                                    Ready
                                  </button>
                                </div>
                              </div>
                            )}
                            {order.status === 'Washing' && (
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'Drying')}
                                className="flex-1 bg-zinc-100 dark:bg-zinc-800 py-2 rounded-xl text-sm font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                              >
                                Move to Drying
                              </button>
                            )}
                            {order.status === 'Drying' && (
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'Ready for Delivery')}
                                className="flex-1 bg-sky-100 dark:bg-sky-900/30 text-sky-600 py-2 rounded-xl text-sm font-bold hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors"
                              >
                                Mark Ready
                              </button>
                            )}
                            {order.status === 'Ready for Delivery' && (
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'Out for Delivery')}
                                className="flex-1 bg-sky-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-sky-700 transition-colors"
                              >
                                Start Delivery
                              </button>
                            )}
                            {order.status === 'Out for Delivery' && (
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'Delivered')}
                                className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
                              >
                                Confirm Delivery
                              </button>
                            )}
                            <a 
                              href={`https://www.google.com/maps/dir/?api=1&destination=${order.lat},${order.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 hover:text-sky-600 transition-colors"
                            >
                              <Navigation className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Available Orders */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Available Nearby</h3>
                  <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-full sm:w-auto">
                    <button 
                      onClick={() => setDriverFilter('all')}
                      className={cn(
                        "flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all",
                        driverFilter === 'all' ? "bg-white dark:bg-zinc-700 text-sky-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      All Orders
                    </button>
                    <button 
                      onClick={() => setDriverFilter('pickup')}
                      className={cn(
                        "flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all",
                        driverFilter === 'pickup' ? "bg-white dark:bg-zinc-700 text-sky-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      Pickups
                    </button>
                    <button 
                      onClick={() => setDriverFilter('delivery')}
                      className={cn(
                        "flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all",
                        driverFilter === 'delivery' ? "bg-white dark:bg-zinc-700 text-sky-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      Deliveries
                    </button>
                  </div>
                </div>
                {availableOrders.filter(o => {
                  if (driverFilter === 'all') return true;
                  if (driverFilter === 'pickup') return o.status === 'Pending';
                  if (driverFilter === 'delivery') return o.status === 'Ready for Delivery';
                  return true;
                }).length === 0 ? (
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-8 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                    <p className="text-zinc-400 text-sm">No {driverFilter !== 'all' ? driverFilter : ''} orders in your area right now.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {availableOrders.filter(o => {
                      if (driverFilter === 'all') return true;
                      if (driverFilter === 'pickup') return o.status === 'Pending';
                      if (driverFilter === 'delivery') return o.status === 'Ready for Delivery';
                      return true;
                    }).map(order => (
                      <div key={order.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-sky-50 dark:bg-sky-900/20 p-2 rounded-xl">
                            <Package className="text-sky-600 dark:text-sky-400 w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm dark:text-white">{order.customer_name}</p>
                            <p className="text-[10px] text-zinc-500">{order.address}</p>
                            <p className="text-[10px] font-bold text-sky-600 mt-1">
                              {order.status === 'Pending' ? 'Pickup' : 'Delivery'} • ${order.total_price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => acceptOrder(order.id)}
                          className="bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-sky-700 transition-colors shadow-md shadow-sky-100 dark:shadow-none"
                        >
                          Accept
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'auth' && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-display font-bold dark:text-white">
                    {authMode === 'login' ? 'Welcome Back' : 'Join the Fleet'}
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    {authMode === 'login' ? 'Login to your driver account' : 'Sign up to start earning with BUBBLES'}
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === 'signup' && (
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
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase ml-1">Email Address</label>
                    <input 
                      required
                      type="email" 
                      placeholder="driver@example.com"
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
        </AnimatePresence>
      </main>

      {/* Footer / Contact */}
      <footer className="bg-zinc-900 dark:bg-black text-white p-8 pb-12 transition-colors">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Droplets className="text-sky-400 w-6 h-6" />
              <h2 className="text-xl font-display font-bold">BUBBLES</h2>
            </div>
            <p className="text-zinc-400 text-sm max-w-xs">
              Dar es Salaam's most reliable laundry service. We take care of your clothes so you can take care of your life.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500">Contact Us</h3>
            <div className="space-y-2">
              <a href="tel:+255700000000" className="flex items-center gap-2 text-zinc-300 hover:text-sky-400 transition-colors">
                <Phone className="w-4 h-4" />
                +255 700 000 000
              </a>
              <div className="flex items-center gap-2 text-zinc-300">
                <MapPin className="w-4 h-4" />
                Kariakoo, Dar es Salaam, Tanzania
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-zinc-500 text-xs">
          © {new Date().getFullYear()} BUBBLES Laundry Service. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
