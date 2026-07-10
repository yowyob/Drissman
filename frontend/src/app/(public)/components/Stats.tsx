"use client";

import { useEffect, useRef, useState } from "react";
import { Users, GraduationCap, Trophy } from "lucide-react";

function useCounter(end: number, duration: number = 2) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                let start = 0;
                const step = end / (duration * 60);
                const timer = setInterval(() => {
                    start += step;
                    if (start >= end) { setCount(end); clearInterval(timer); }
                    else { setCount(Math.floor(start)); }
                }, 1000 / 60);
            }
        }, { threshold: 0.5 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end, duration]);
    return { count, ref };
}

export default function Stats() {
    const schools = useCounter(150);
    const students = useCounter(25000);
    const success = useCounter(92);

    // Gradient texturé identique au Hero
    const texturedGradient = `
        url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='5'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='1.3'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E"),
        radial-gradient(ellipse at 50% 100%, #ffc107 0%, #e6a800 15%, #b8860b 35%, #7a5c08 55%, #4a3805 75%, #2a2003 100%)
    `;

    const stats = [
        { icon: Users, value: schools.count, suffix: "+", label: "Partenaires", ref: schools.ref },
        { icon: GraduationCap, value: students.count, suffix: "", label: "Élèves", ref: students.ref, format: true },
        { icon: Trophy, value: success.count, suffix: "%", label: "Réussite", ref: success.ref }
    ];

    return (
        <section className="py-16 bg-asphalt relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none"></div>

            <div className="container-wide relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, i) => (
                        <div
                            key={i}
                            ref={stat.ref}
                            className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center transition-all duration-300 hover:border-signal/30 hover:bg-white/8"
                            style={{
                                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)'
                            }}
                        >
                            {/* Icon */}
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-signal/10 rounded-xl border border-signal/20 group-hover:bg-signal/20 transition-all">
                                    <stat.icon className="h-6 w-6 text-signal" />
                                </div>
                            </div>

                            {/* Counter with gradient text */}
                            <div
                                className="text-5xl md:text-6xl font-black mb-2"
                                style={{
                                    backgroundImage: texturedGradient,
                                    backgroundSize: '50px 50px, 100% 100%',
                                    backgroundBlendMode: 'overlay, normal',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    color: 'transparent',
                                    filter: 'drop-shadow(0 0 20px rgba(255, 193, 7, 0.3))'
                                }}
                            >
                                {stat.format ? stat.value.toLocaleString() : stat.value}{stat.suffix}
                            </div>

                            {/* Label */}
                            <span className="text-sm text-mist uppercase tracking-wider font-medium">
                                {stat.label}
                            </span>

                            {/* Subtle glow effect on hover */}
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                style={{
                                    boxShadow: '0 0 40px rgba(255, 193, 7, 0.15)'
                                }}
                            ></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
