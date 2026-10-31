import React from "react";
import { MotionConfig } from "motion/react";

interface AppMotionProviderProps {
  children: React.ReactNode;
  reducedMotionSetting?: "user" | "always" | "never";
}

export const AppMotionProvider: React.FC<AppMotionProviderProps> = ({
  children,
  reducedMotionSetting = "user",
}) => {
  return (
    <MotionConfig reducedMotion={reducedMotionSetting}>
      {children}
    </MotionConfig>
  );
};
