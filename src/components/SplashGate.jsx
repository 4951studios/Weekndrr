import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { hideNativeSplash } from "@/lib/native";

/**
 * Branded loading screen that matches the native splash artwork, so the handoff
 * from the OS splash to the app has no white flash.
 */
export default function SplashGate({ children }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    hideNativeSplash();
    const timer = window.setTimeout(() => setVisible(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-[#4338CA] to-[#312E9E]"
            role="status"
            aria-label="Loading Weekndrr"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <svg
                viewBox="0 0 100 100"
                className="h-24 w-24"
                aria-hidden="true"
                fill="none"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="34"
                  stroke="white"
                  strokeOpacity="0.35"
                  strokeWidth="5.5"
                />
                <path
                  d="M24 34 L37 70 L50 45 L63 70 L76 34"
                  stroke="white"
                  strokeWidth="7.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="50" cy="80" r="3.5" fill="#F97316" />
              </svg>

              <span className="mt-5 text-2xl font-extrabold tracking-tight text-white">
                Weekndrr
              </span>
              <span className="mt-1 text-sm text-white/75">
                Your cheapest weekend, sorted
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-16 flex gap-1.5"
            >
              {[0, 1, 2].map((index) => (
                <motion.span
                  key={index}
                  className="h-2 w-2 rounded-full bg-white/70"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    delay: index * 0.16,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
