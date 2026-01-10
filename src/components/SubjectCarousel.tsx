import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calculator, Beaker, Dna, Atom, Languages, BookA, Cpu, ChevronLeft, ChevronRight } from 'lucide-react';

interface Subject {
    name: string;
    icon: React.FC<{ size?: number; className?: string }>;
    color: string;
    gradient: string;
}

const subjects: Subject[] = [
    { name: 'Maths', icon: Calculator, color: 'bg-blue-100 dark:bg-blue-900/30', gradient: 'from-blue-400 to-cyan-400' },
    { name: 'Science', icon: Beaker, color: 'bg-green-100 dark:bg-green-900/30', gradient: 'from-green-400 to-emerald-400' },
    { name: 'Biology', icon: Dna, color: 'bg-purple-100 dark:bg-purple-900/30', gradient: 'from-purple-400 to-pink-400' },
    { name: 'Chemistry', icon: Atom, color: 'bg-orange-100 dark:bg-orange-900/30', gradient: 'from-orange-400 to-yellow-400' },
    { name: 'English', icon: BookA, color: 'bg-pink-100 dark:bg-pink-900/30', gradient: 'from-pink-400 to-rose-400' },
    { name: 'Physics', icon: Atom, color: 'bg-indigo-100 dark:bg-indigo-900/30', gradient: 'from-indigo-400 to-blue-400' },
    { name: 'Kannada', icon: Languages, color: 'bg-teal-100 dark:bg-teal-900/30', gradient: 'from-teal-400 to-cyan-400' },
    { name: 'Computer Science', icon: Cpu, color: 'bg-violet-100 dark:bg-violet-900/30', gradient: 'from-violet-400 to-purple-400' },
];

const SubjectCarousel: React.FC = () => {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(0);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && currentIndex < subjects.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
        if (isRightSwipe && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const goToNext = () => {
        if (currentIndex < subjects.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    return (
        <div className="w-full">
            {/* Mobile Carousel View (< md) */}
            <div className="block md:hidden">
                <div className="relative px-4">
                    {/* Carousel Container */}
                    <div 
                        className="overflow-hidden"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                                {(() => {
                                    const subject = subjects[currentIndex];
                                    const IconComponent = subject.icon;
                                    return (
                                        <button
                                            onClick={() => navigate(`/courses?search=${subject.name}`)}
                                            className={`w-full ${subject.color} rounded-3xl p-8 shadow-lg border-2 border-white/50 dark:border-gray-700/50 backdrop-blur-sm transition-all duration-300 active:scale-95`}
                                        >
                                            {/* Icon Circle */}
                                            <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${subject.gradient} flex items-center justify-center shadow-md`}>
                                                <IconComponent size={36} className="text-white" />
                                            </div>

                                            {/* Subject Name */}
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                                                {subject.name}
                                            </h3>

                                            {/* Explore Button */}
                                            <div className={`mt-4 px-8 py-3 bg-gradient-to-r ${subject.gradient} rounded-full text-white text-sm font-semibold shadow-md mx-auto inline-block`}>
                                                Explore
                                            </div>
                                        </button>
                                    );
                                })()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation Arrows */}
                    <button
                        onClick={goToPrev}
                        disabled={currentIndex === 0}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg ${
                            currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
                        }`}
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </button>

                    <button
                        onClick={goToNext}
                        disabled={currentIndex === subjects.length - 1}
                        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg ${
                            currentIndex === subjects.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
                        }`}
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </button>
                </div>

                {/* Scroll Indicators */}
                <div className="flex justify-center gap-2 mt-6">
                    {subjects.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`transition-all duration-300 rounded-full ${
                                index === currentIndex
                                    ? 'w-8 h-2 bg-gradient-to-r from-purple-600 to-blue-600'
                                    : 'w-2 h-2 bg-gray-300 dark:bg-gray-600'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Counter */}
                <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                    {currentIndex + 1} / {subjects.length}
                </div>
            </div>

            {/* Desktop Grid View (>= md) - Keep existing grid */}
            <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-8 gap-4 max-w-7xl mx-auto">
                {subjects.map((subject, index) => {
                    const IconComponent = subject.icon;
                    return (
                        <motion.button
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05, duration: 0.4 }}
                            whileHover={{
                                scale: 1.1,
                                y: -8,
                                transition: { duration: 0.2 }
                            }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(`/courses?search=${subject.name}`)}
                            className="group relative px-4 py-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-transparent transition-all duration-300 shadow-md hover:shadow-2xl overflow-hidden"
                        >
                            {/* Gradient Background on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                            {/* Subject Icon and Text */}
                            <div className="relative flex flex-col items-center gap-2 z-10">
                                <IconComponent
                                    size={32}
                                    className="text-gray-700 dark:text-gray-300 group-hover:text-white transition-colors duration-300"
                                />
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-white transition-colors duration-300 text-center">
                                    {subject.name}
                                </span>
                            </div>

                            {/* Corner Accent */}
                            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-transparent dark:from-cyan-400/10 rounded-bl-2xl" />
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default SubjectCarousel;
