"use client";

import { useEffect, useRef, useState } from "react";
import { Users, GraduationCap, Trophy } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * StatsVariant2 — "Giant Overlay Numbers"
 * 
 * Oversized numbers as background elements with smaller labels overlaid.
 * Editorial/magazine inspired layout for maximum visual impact.
 */

function useCounter(end: number, duration: number = 2) {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (hasAnimated) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !hasAnimated) {
                setHasAnimated(true);
                let start = 0;
                const step = end / (duration * 60);
                const timer = setInterval(() => {
                    start += step;
                    if (start >= end) {
                        setCount(end);
                        clearInterval(timer);
                    } else {
                        setCount(Math.floor(start));
                    }
                }, 1000 / 60);
            }
        }, { threshold: 0.3 });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end, duration, hasAnimated]);

    return { count, ref };
}

interface StatCardProps {
    icon: React.ElementType;
    value: number;
    finalValue: number;  // Static final value for giant background
    suffix: string;
    label: string;
    subtitle: string;
    format?: boolean;
    delay: number;
}

function StatCard({ icon: Icon, value, finalValue, suffix, label, subtitle, format, delay }: StatCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [displayCount, setDisplayCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Counting animation for giant background number
    useEffect(() => {
        if (hasAnimated || !cardRef.current) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !hasAnimated) {
                setHasAnimated(true);
                const duration = 2000; // 2 seconds
                const steps = 60;
                const increment = finalValue / steps;
                let current = 0;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= finalValue) {
                        setDisplayCount(finalValue);
                        clearInterval(timer);
                    } else {
                        setDisplayCount(Math.floor(current));
                    }
                }, duration / steps);
            }
        }, { threshold: 0.3 });

        observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, [finalValue, hasAnimated]);

    useEffect(() => {
        if (!cardRef.current) return;

        const ctx = gsap.context(() => {
            // Content fade in
            gsap.from(".stat-content", {
                y: 30,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: cardRef.current,
                    start: "top 80%"
                },
                delay: delay + 0.3
            });
        }, cardRef);

        return () => ctx.revert();
    }, [delay]);

    // Display animated count with locale formatting for giant background
    const displayValue = displayCount.toLocaleString('fr-FR');

    return (
        <div
            ref={cardRef}
            className="relative flex flex-col items-center justify-center min-h-[280px] group cursor-default"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Giant background number - now with counting animation */}
            <div
                className="giant-number absolute inset-0 flex items-center justify-center pointer-events-none select-none transition-all duration-500"
                style={{
                    opacity: isHovered ? 0.15 : 0.07,
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)'
                }}
            >
                <span
                    className="font-black text-signal leading-none whitespace-nowrap"
                    style={{
                        fontSize: 'clamp(80px, 15vw, 160px)',
                        textShadow: isHovered
                            ? '0 0 80px rgba(255, 193, 7, 0.4)'
                            : '0 0 40px rgba(255, 193, 7, 0.15)',
                        letterSpacing: '-0.05em'
                    }}
                >
                    {displayValue}{suffix}
                </span>
            </div>

            {/* Foreground content */}
            <div className="stat-content relative z-10 flex flex-col items-center text-center px-4">
                {/* Icon badge */}
                <div
                    className="mb-4 p-4 bg-signal/10 rounded-2xl border border-signal/20 transition-all duration-300"
                    style={{
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: isHovered ? '0 0 30px rgba(255, 193, 7, 0.3)' : 'none'
                    }}
                >
                    <Icon className="h-8 w-8 text-signal" />
                </div>

                {/* Label */}
                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                    {label}
                </h3>

                {/* Subtitle */}
                <p className="text-sm text-mist max-w-[200px]">
                    {subtitle}
                </p>

                {/* Animated underline */}
                <div
                    className="mt-4 h-0.5 bg-gradient-to-r from-transparent via-signal to-transparent transition-all duration-500"
                    style={{
                        width: isHovered ? '80px' : '40px',
                        opacity: isHovered ? 1 : 0.5
                    }}
                />
            </div>
        </div>
    );
}

export default function StatsVariant2() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const schools = useCounter(150);
    const students = useCounter(25000);
    const success = useCounter(92);

    const stats = [
        {
            icon: Users,
            value: schools.count,
            finalValue: 150,
            suffix: "+",
            label: "Partenaires",
            subtitle: "Auto-écoles de confiance dans toute la France",
            delay: 0
        },
        {
            icon: GraduationCap,
            value: students.count,
            finalValue: 25000,
            suffix: "",
            label: "Élèves formés",
            subtitle: "Et des milliers de permis obtenus",
            format: true,
            delay: 0.15
        },
        {
            icon: Trophy,
            value: success.count,
            finalValue: 92,
            suffix: "%",
            label: "Taux de réussite",
            subtitle: "Supérieur à la moyenne nationale",
            delay: 0.3
        }
    ];

    return (
        <section ref={sectionRef} className="py-20 bg-asphalt relative overflow-hidden">
            {/* Subtle radial glow in center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-signal/5 rounded-full blur-[150px] pointer-events-none" />

            {/* Grid lines for visual interest */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />
                <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />
            </div>

            <div className="container-wide relative z-10" ref={schools.ref}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
                    {stats.map((stat, i) => (
                        <StatCard
                            key={i}
                            icon={stat.icon}
                            value={stat.value}
                            finalValue={stat.finalValue}
                            suffix={stat.suffix}
                            label={stat.label}
                            subtitle={stat.subtitle}
                            format={stat.format}
                            delay={stat.delay}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
