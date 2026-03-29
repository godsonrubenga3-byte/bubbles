import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";

interface SuccessAnimationProps {
  isDone: boolean;
  onComplete?: () => void;
}

export function SuccessAnimation({ isDone, onComplete }: SuccessAnimationProps) {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center mx-auto">
      {/* The Box */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-sky-100 dark:bg-sky-900/30 rounded-3xl border-2 border-sky-200 dark:border-sky-800 flex items-center justify-center relative z-10"
      >
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12 }}
              className="bg-sky-500 rounded-full p-3 text-white shadow-lg"
            >
              <Check className="w-8 h-8 stroke-[3]" />
            </motion.div>
          ) : (
            <motion.div
              key="box-inner"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-12 h-12 bg-sky-200 dark:bg-sky-800/50 rounded-2xl"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Orbiting Bubbles */}
      {!isDone && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-6 h-6 bg-sky-400 dark:bg-sky-600 rounded-full shadow-lg"
              animate={{
                rotate: 360,
                x: Math.cos((i * 120 * Math.PI) / 180) * 60,
                y: Math.sin((i * 120 * Math.PI) / 180) * 60,
              }}
              transition={{
                rotate: { repeat: Infinity, duration: 3, ease: "linear" },
                x: { duration: 0 },
                y: { duration: 0 }
              }}
              style={{
                transformOrigin: "center center",
                left: "calc(50% - 12px)",
                top: "calc(50% - 12px)",
              }}
            />
          ))}
          
          <motion.div
            className="absolute inset-0 border-2 border-dashed border-sky-200 dark:border-sky-800 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          />
        </>
      )}

      {/* Popping Bubbles on completion */}
      <AnimatePresence>
        {isDone && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`pop-${i}`}
                initial={{ 
                  x: Math.cos((i * 120 * Math.PI) / 180) * 60,
                  y: Math.sin((i * 120 * Math.PI) / 180) * 60,
                  scale: 1,
                  opacity: 1 
                }}
                animate={{ 
                  x: Math.cos((i * 120 * Math.PI) / 180) * 120,
                  y: Math.sin((i * 120 * Math.PI) / 180) * 120,
                  scale: 2,
                  opacity: 0 
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                onAnimationComplete={() => i === 0 && onComplete?.()}
                className="absolute w-6 h-6 bg-sky-400 dark:bg-sky-600 rounded-full"
                style={{
                  left: "calc(50% - 12px)",
                  top: "calc(50% - 12px)",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
