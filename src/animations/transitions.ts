export const SPRING_FAST = {
  type: "spring" as const,
  stiffness: 350,
  damping: 25,
};

export const SPRING_TACTILE = {
  type: "spring" as const,
  stiffness: 300,
  damping: 24,
};

export const SPRING_GENTLE = {
  type: "spring" as const,
  stiffness: 220,
  damping: 28,
};

export const TRANSITION_FAST = {
  duration: 0.16,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const TRANSITION_SMOOTH = {
  duration: 0.24,
  ease: [0.16, 1, 0.3, 1] as const,
};

export const TRANSITION_CROSSFADE = {
  duration: 0.32,
  ease: "easeInOut" as const,
};
