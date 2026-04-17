"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface ScrollSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  staggerChildren?: number;
  threshold?: number;
}

export default function ScrollSection({ 
  children, 
  className = "", 
  delay = 0,
  staggerChildren = 0.1,
  threshold = 0.15
}: ScrollSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const marginStr = `0px 0px -${Math.round(threshold * 100)}% 0px` as any;
  const isInView = useInView(ref, { once: true, margin: marginStr });

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => (
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 50, filter: "blur(10px)" }}
          transition={{
            duration: 0.8,
            delay: delay + index * staggerChildren,
            ease: [0.16, 1, 0.3, 1], // Custom snappy spring-like ease
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
