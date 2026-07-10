"use client";

import { useEffect, useRef, useState } from "react";
import { Quote, Star } from "lucide-react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * TestimonialsVariant — "Portrait Hover Reveal" + Polish Pass #1
 * 
 * Improvements:
 * - Subtle parallax effect on image (moves opposite to hover direction)
 * - Dynamic shadow that expands on hover (lift effect)
 */

const testimonials = [
    {
        id: 1,
        quote: "Grâce à DRISSMAN, j'ai trouvé une auto-école près de chez moi en 5 minutes. Le moniteur était top et j'ai eu mon permis du premier coup !",
        name: "Sarah M.",
        role: "Étudiante, Lyon",
        rating: 5,
        image: "/assets/testimonial-sarah.png",
        offsetY: 125
    },
    {
        id: 2,
        quote: "L'inscription en ligne est ultra simple. Plus besoin d'appeler 10 auto-écoles pour comparer les prix. Tout est transparent.",
        name: "Thomas L.",
        role: "Développeur, Paris",
        rating: 5,
        image: "/assets/testimonial-thomas.png",
        offsetY: 110
    },
    {
        id: 3,
        quote: "J'avais peur de reprendre le volant après 10 ans. Mon moniteur a été patient et j'ai retrouvé confiance. Merci DRISSMAN !",
        name: "Marie D.",
        role: "Entrepreneuse, Bordeaux",
        rating: 5,
        image: "/assets/testimonial-marie.png",
        offsetY: 125
    }
];

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
        setMousePos({ x, y });
    };

    return (
        <div
            ref={cardRef}
            className="portrait-card group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-shadow duration-500"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0, y: 0 }); }}
            onMouseMove={handleMouseMove}
            style={{
                boxShadow: isHovered
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(234, 179, 8, 0.15)'
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
        >
            {/* Portrait Image with parallax effect */}
            <Image
                src={testimonial.image}
                alt={testimonial.name}
                fill
                className="object-cover transition-transform duration-700 ease-out"
                style={{
                    transform: isHovered
                        ? `scale(1.1) translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)`
                        : 'scale(1) translate(0, 0)'
                }}
            />

            {/* Synchronized gradient - grows with text animation */}
            <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent transition-all duration-500 ease-out"
                style={{ height: isHovered ? '100%' : '40%' }}
            ></div>

            {/* SINGLE BLOCK: slides up on hover */}
            <div
                className="absolute bottom-0 left-0 right-0 p-6 transition-transform duration-500 ease-out"
                style={{ transform: `translateY(${isHovered ? 0 : testimonial.offsetY}px)` }}
            >
                {/* TOP OF BLOCK: Name, Role, Stars */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="text-white font-bold text-lg">{testimonial.name}</div>
                        <div className="text-mist text-sm">{testimonial.role}</div>
                    </div>
                    {/* Stars with stagger animation */}
                    <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                            <Star
                                key={i}
                                className="w-4 h-4 fill-signal text-signal transition-all duration-300"
                                style={{
                                    opacity: isHovered ? 1 : 0.6,
                                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                                    transitionDelay: isHovered ? `${i * 100}ms` : '0ms'
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* BOTTOM OF BLOCK: Quote (hidden by default, revealed on slide) */}
                <div>
                    {/* Quote icon */}
                    <Quote className="w-6 h-6 text-signal/60 mb-2" />

                    {/* Quote text */}
                    <p className="text-white/90 text-sm leading-relaxed">
                        &quot;{testimonial.quote}&quot;
                    </p>
                </div>
            </div>

            {/* Border - instant appear */}
            <div
                className={`absolute inset-0 rounded-2xl border-2 pointer-events-none ${isHovered ? 'border-signal/40' : 'border-transparent'}`}
                style={{ transition: 'border-color 0.05s' }}
            ></div>
        </div>
    );
}

export default function TestimonialsVariant() {
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".portrait-card", {
                y: 80,
                opacity: 0,
                duration: 0.9,
                stagger: 0.2,
                ease: "power3.out",
                scrollTrigger: { trigger: sectionRef.current, start: "top 75%" }
            });

            gsap.from(".testimonials-header", {
                y: 40,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: { trigger: sectionRef.current, start: "top 80%" }
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-24 bg-asphalt relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-signal/5 rounded-full blur-[200px]"></div>

            <div className="container-wide relative z-10">
                {/* Header */}
                <div className="testimonials-header text-center mb-16">
                    <span className="inline-block text-signal text-xs font-bold tracking-[0.2em] uppercase mb-4">
                        Témoignages
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
                        Ils ont réussi avec <span className="text-signal">nous</span>
                    </h2>
                    <p className="text-mist text-lg max-w-xl mx-auto mb-4">
                        Survolez pour découvrir leurs histoires.
                    </p>
                    {/* Social proof counter */}
                    <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="text-signal font-bold">500+</span>
                        <span className="text-mist">élèves satisfaits</span>
                    </div>
                </div>

                {/* Portrait Cards Grid - Zigzag layout */}
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={testimonial.id}
                            style={{ transform: index === 1 ? 'translateY(-24px)' : 'translateY(0)' }}
                        >
                            <TestimonialCard testimonial={testimonial} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
