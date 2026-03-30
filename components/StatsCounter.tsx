"use client";

import { useState, useEffect, useRef } from "react";

interface StatsCounterProps {
    startValue?: number;
    endValue: number;
    suffix?: string;
    prefix?: string;
    label: string;
    duration?: number;
    children?: React.ReactNode;
}

export default function StatsCounter({
    startValue = 0,
    endValue,
    suffix = "",
    prefix = "",
    label,
    duration = 2000,
    children,
}: StatsCounterProps) {
    const [count, setCount] = useState(startValue);
    const [isVisible, setIsVisible] = useState(false);
    const hasAnimated = useRef(false);
    const elementRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for scroll-based trigger
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    setIsVisible(true);
                    hasAnimated.current = true;
                }
            },
            { threshold: 0.3 }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => {
            if (elementRef.current) {
                observer.unobserve(elementRef.current);
            }
        };
    }, []);

    // Count-up animation using requestAnimationFrame
    useEffect(() => {
        if (!isVisible) return;

        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation (easeOutCubic)
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            const currentCount = Math.floor(startValue + (endValue - startValue) * easeProgress);
            setCount(currentCount);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(endValue);
            }
        };

        requestAnimationFrame(animate);
    }, [isVisible, endValue, startValue, duration]);

    return (
        <div ref={elementRef} className="flex flex-col items-center group">
            <div className="flex flex-row items-center justify-center gap-3">
                <h3 className="text-[1.6rem] sm:text-[2.5rem] md:text-[3.1rem] font-bold text-brand-primary mb-[4px] sm:mb-[6px] font-sans transition-transform duration-500 group-hover:scale-105 leading-none">
                    {prefix}{count}{suffix}
                </h3>
                {children && (
                    <div className="mb-[2px] sm:mb-[6px]">
                        {children}
                    </div>
                )}
            </div>
            <p className="text-[0.8rem] sm:text-[0.9rem] md:text-[0.95rem] text-gray-500 font-bold uppercase tracking-wider leading-tight text-center mt-1">
                {label}
            </p>
        </div>
    );
}
