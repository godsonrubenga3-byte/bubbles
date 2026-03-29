import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, X, Sparkles, MapPin, Package, Clock } from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: OnboardingStep[] = [
  {
    title: "Welcome to Bubbletz",
    description: "Dar es Salaam's most reliable laundry service. We've made laundry as simple as a tap.",
    icon: <Sparkles className="w-8 h-8 text-sky-500" />
  },
  {
    title: "Pin Your Location",
    description: "Use our interactive map to tell us exactly where to pick up your laundry. No more directions needed!",
    icon: <MapPin className="w-8 h-8 text-sky-500" />
  },
  {
    title: "Track Everything",
    description: "From pickup to washing, drying, and delivery—watch your laundry's journey in real-time.",
    icon: <Package className="w-8 h-8 text-sky-500" />
  },
  {
    title: "Quick Turnaround",
    description: "Get your clothes back fresh, clean, and folded within 24-48 hours. Laundry day is now every day!",
    icon: <Clock className="w-8 h-8 text-sky-500" />
  }
];

interface OnboardingGuideProps {
  onComplete: () => void;
}

export function OnboardingGuide({ onComplete }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    localStorage.setItem('bubbletz_onboarded', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-8"
      >
        <button
          onClick={finish}
          className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-sky-50 dark:bg-sky-900/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              {STEPS[currentStep].icon}
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-display font-bold dark:text-white leading-tight">
                {STEPS[currentStep].title}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {STEPS[currentStep].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col gap-4">
          <div className="flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? "w-8 bg-sky-500" : "w-2 bg-zinc-200 dark:bg-zinc-800"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-full bg-sky-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-sky-700 active:scale-95 transition-all shadow-lg shadow-sky-200 dark:shadow-sky-900/20 mt-4"
          >
            {currentStep === STEPS.length - 1 ? "Get Started" : "Continue"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
