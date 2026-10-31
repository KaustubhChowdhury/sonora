import React from "react";
import { AnimatePresence, motion } from "motion/react";

interface AnimatedPageProps {
  pageKey: string;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({
  pageKey,
  children,
  className = "flex-1 flex flex-col h-full overflow-hidden",
}) => {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pageKey}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
