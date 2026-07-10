"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

// Page-level fade-up wrapper
export function PageTransition({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Staggered container for lists/grids
export function StaggerContainer({ children, className = "", staggerDelay = 0.05 }: { children: ReactNode; className?: string; staggerDelay?: number }) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: {},
                visible: { transition: { staggerChildren: staggerDelay } },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Individual stagger item
export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 16, scale: 0.98 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Skeleton loader block
export function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-white/[0.04] rounded-xl ${className}`} />
    );
}

// Skeleton card for KPI-style elements
export function SkeletonCard() {
    return (
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5 space-y-3 animate-pulse">
            <Skeleton className="h-5 w-5 rounded-lg" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-32" />
        </div>
    );
}

// Skeleton table row
export function SkeletonRow({ cols = 5 }: { cols?: number }) {
    return (
        <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
            <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
            {Array.from({ length: cols - 1 }).map((_, i) => (
                <Skeleton key={i} className={`h-4 ${i === 0 ? "w-32" : "w-20"} flex-shrink-0`} />
            ))}
        </div>
    );
}

// Number count-up animation
export function AnimatedNumber({ value, duration = 0.8 }: { value: number; duration?: number }) {
    return (
        <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {value}
        </motion.span>
    );
}
