import React from 'react';
import { motion } from 'motion/react';
import { 
  Truck, 
  Clock, 
  MapPin, 
  Package, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Calendar,
  Sun,
  Moon,
  CheckCircle2,
  Circle,
  User,
  Mail
} from 'lucide-react';
import { PRICING } from '../constants';
import { cn } from '../cn';
import { hapticClick } from '../App';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
  >
    <div className="bg-sky-50 dark:bg-sky-900/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-7 h-7 text-sky-500" />
    </div>
    <h3 className="text-xl font-bold mb-3 dark:text-white">{title}</h3>
    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">
      {description}
    </p>
  </motion.div>
);

export default function LandingPage({ onGetStarted, onLogin, darkMode, onToggleDarkMode }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black transition-colors duration-500 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 px-6 pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-sky-500 p-1.5 rounded-xl shadow-lg shadow-sky-500/20">
              <img src="/images/logo.png" alt="Logo" className="w-6 h-6 invert brightness-0" />
            </div>
            <span className="text-xl font-display font-bold uppercase tracking-widest dark:text-white">bubbletz</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { hapticClick(); onToggleDarkMode(); }}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-90"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />
            <button 
              onClick={() => { hapticClick(); onLogin(); }}
              className="text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-sky-500 transition-colors px-2"
            >
              Sign In
            </button>
            <button 
              onClick={() => { hapticClick(); onGetStarted(); }}
              className="bg-sky-500 text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-sky-600 shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-[calc(env(safe-area-inset-top,0px)+120px)] pb-32 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-sky-100/40 via-sky-50/10 to-transparent dark:from-sky-900/10 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-full shadow-sm text-sky-600 dark:text-sky-400 text-xs font-black uppercase tracking-wider mb-8"
          >
            <Sparkles className="w-3 h-3 fill-current" />
            <span>Experience Laundry Reimagined</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-display font-bold mb-8 leading-[0.9] dark:text-white"
          >
            Laundry Day? <br />
            <span className="text-sky-500">Not Anymore.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 mb-12 leading-relaxed max-w-2xl mx-auto"
          >
            Professional pickup, premium care, and 24-hour delivery. 
            The simplest way to stay fresh, every single day.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={() => { hapticClick(); onGetStarted(); }}
              className="w-full sm:w-auto bg-zinc-950 dark:bg-sky-500 text-white px-10 py-5 rounded-3xl text-lg font-black uppercase tracking-widest hover:scale-105 active:scale-95 shadow-2xl shadow-sky-500/10 transition-all"
            >
              Schedule First Pickup
            </button>
            <button 
              onClick={() => { hapticClick(); onLogin(); }}
              className="w-full sm:w-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-10 py-5 rounded-3xl text-lg font-black uppercase tracking-widest hover:bg-zinc-50 transition-all dark:text-white"
            >
              Sign In
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-white dark:bg-zinc-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-12">
            <FeatureCard 
              icon={MapPin}
              title="Smart Pickup"
              description="Our interactive map ensures we find your door every time without phone calls or confusion."
              delay={0.1}
            />
            <FeatureCard 
              icon={Truck}
              title="Next-Day Return"
              description="Fresh, folded, and fragranced laundry returned to your doorstep within 24 hours of pickup."
              delay={0.2}
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Premium Care"
              description="Using pH-balanced detergents and high-heat sanitization for a clean you can feel."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* How it Works - THE BURNER */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="bg-sky-600 dark:bg-sky-700 rounded-[3rem] p-12 lg:p-20 text-white relative overflow-hidden shadow-2xl">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
            
            <div className="relative z-10">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">How bubbletz works</h2>
                <p className="text-sky-100 text-lg max-w-2xl mx-auto opacity-90">
                  Getting your laundry done has never been this simple. Follow these four easy steps to fresh clothes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { 
                    step: '01', 
                    title: 'Pin Your Door', 
                    desc: 'Sign up and use our smart map to pin your exact location for pickup.',
                    icon: MapPin
                  },
                  { 
                    step: '02', 
                    title: 'Schedule Pickup', 
                    desc: 'Tell us what you have. We collect from your doorstep within 24 hours.',
                    icon: Package
                  },
                  { 
                    step: '03', 
                    title: 'Expert Cleaning', 
                    desc: 'We wash, dry, and steam-fold your clothes with professional care.',
                    icon: Sparkles
                  },
                  { 
                    step: '04', 
                    title: 'Fresh Delivery', 
                    desc: 'Your laundry is returned fresh and fragrant, ready to wear.',
                    icon: Truck
                  }
                ].map((item, i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl font-display font-black opacity-30">{item.step}</span>
                      <div className="h-px flex-1 bg-white/20" />
                    </div>
                    <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-xl font-bold">{item.title}</h4>
                    <p className="text-sky-100/70 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-16 text-center">
                <button 
                  onClick={() => { hapticClick(); onGetStarted(); }}
                  className="bg-white text-sky-600 px-10 py-5 rounded-2xl text-lg font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                >
                  Start Your First Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - PRO VERSION */}
      <section className="py-32 px-6 bg-zinc-50/50 dark:bg-black relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
        
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 px-4 py-2 rounded-full text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest mb-6"
            >
              <Calendar className="w-4 h-4" />
              25% Off Every Weekend
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 dark:text-white">Premium Care. <br/><span className="text-zinc-400 dark:text-zinc-500">Simple Rates.</span></h2>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8 items-stretch justify-center">
            {/* Normal Clothes Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 max-w-md bg-white dark:bg-zinc-950 p-10 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-none relative flex flex-col group hover:border-sky-500/50 transition-colors"
            >
              <div className="absolute top-8 right-8 bg-sky-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-sky-500/20">Best Value</div>
              
              <div className="mb-10">
                <div className="bg-sky-50 dark:bg-sky-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <Package className="w-8 h-8 text-sky-500" />
                </div>
                <h3 className="text-2xl font-display font-bold dark:text-white mb-2">Normal Clothes</h3>
                <p className="text-zinc-500 text-sm">Everyday wear, shirts, and jeans.</p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {[
                  'Professional Wash & Dry',
                  'Perfect Steam Folding',
                  'Eco-Friendly Detergents',
                  '24h Standard Delivery'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <CheckCircle2 className="w-4 h-4 text-sky-500" />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-zinc-100 dark:border-zinc-900">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Regular Price</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold dark:text-white">TSh</span>
                    <span className="text-3xl font-display font-bold dark:text-white">10k</span>
                    <span className="text-zinc-400 text-sm">/kg</span>
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg inline-block mb-8">
                  <p className="text-amber-700 dark:text-amber-500 text-xs font-black uppercase">Weekend: TSh 7,500/kg</p>
                </div>
                
                <button 
                  onClick={() => { hapticClick(); onGetStarted(); }}
                  className="w-full py-5 rounded-2xl bg-sky-500 text-white font-black uppercase tracking-widest text-sm hover:bg-sky-600 shadow-xl shadow-sky-500/20 transition-all active:scale-[0.98]"
                >
                  Book Pickup
                </button>
              </div>
            </motion.div>

            {/* Blankets Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 max-w-md bg-white dark:bg-zinc-950 p-10 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-none flex flex-col group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="mb-10">
                <div className="bg-zinc-50 dark:bg-zinc-900/40 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <Circle className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-2xl font-display font-bold dark:text-white mb-2">Comforters</h3>
                <p className="text-zinc-500 text-sm">Heavy blankets and bedsheets.</p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {[
                  'Deep-Fiber Sanitization',
                  'High-Heat Bacteria Kill',
                  'Extra Fabric Softener',
                  'Individually Wrapped'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-zinc-100 dark:border-zinc-900">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Regular Price</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold dark:text-white">TSh</span>
                    <span className="text-3xl font-display font-bold dark:text-white">15k</span>
                    <span className="text-zinc-400 text-sm">/item</span>
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg inline-block mb-8">
                  <p className="text-amber-700 dark:text-amber-500 text-xs font-black uppercase">Weekend: TSh 11,250/item</p>
                </div>
                
                <button 
                  onClick={() => { hapticClick(); onGetStarted(); }}
                  className="w-full py-5 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-sm hover:bg-black dark:hover:bg-zinc-100 transition-all active:scale-[0.98]"
                >
                  Book Pickup
                </button>
              </div>
            </motion.div>
          </div>
          
          {/* Trust Badges */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-zinc-100 dark:border-zinc-900 pt-20">
            <div className="text-center">
              <h4 className="font-bold dark:text-white mb-2">No Hidden Fees</h4>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm italic">What you see is what you pay. No service or delivery surcharges.</p>
            </div>
            <div className="text-center">
              <h4 className="font-bold dark:text-white mb-2">Bulk Savings</h4>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm italic">Automatically get 2% OFF for every additional 10kg on your order.</p>
            </div>
            <div className="text-center">
              <h4 className="font-bold dark:text-white mb-2">Free Delivery</h4>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm italic">Free pickup and return on all orders over TSh 20,000.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-black border-t border-zinc-100 dark:border-zinc-800 py-16 px-6 pb-[calc(env(safe-area-inset-bottom,0px)+32px)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="bg-sky-500 p-1.5 rounded-lg">
                  <img src="/images/logo.png" alt="Logo" className="w-5 h-5 invert brightness-0" />
                </div>
                <span className="text-xl font-display font-bold uppercase tracking-widest dark:text-white">bubbletz</span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Dar es Salaam's most reliable laundry service. Premium care for your clothes, delivered to your door.
              </p>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest dark:text-white">Quick Links</h4>
              <ul className="space-y-3">
                {['About', 'Pricing', 'Service Area', 'Reviews'].map(link => (
                  <li key={link}><a href="#" className="text-sm text-zinc-500 hover:text-sky-500 transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest dark:text-white">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-zinc-500">
                  <Mail className="w-4 h-4 text-sky-500" />
                  bubblestzlaundry@gmail.com
                </li>
                <li className="flex items-center gap-2 text-sm text-zinc-500">
                  <MapPin className="w-4 h-4 text-sky-500" />
                  Dar es Salaam, TZ
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest dark:text-white">Mobile App</h4>
              <div className="flex flex-col gap-2">
                <div className="bg-zinc-950 dark:bg-zinc-900 p-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-sky-500/5">
                  <div className="bg-white/10 p-2 rounded-lg"><Package className="w-5 h-5 text-white" /></div>
                  <div className="text-white">
                    <p className="text-[10px] opacity-50 uppercase font-black leading-none mb-1">Download for</p>
                    <p className="text-xs font-bold leading-none">Android APK</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-zinc-100 dark:border-zinc-900 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
            <p>© 2026 REBI Group. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-sky-500">Privacy Policy</a>
              <a href="#" className="hover:text-sky-500">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
