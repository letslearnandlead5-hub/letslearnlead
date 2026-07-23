import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    Facebook, 
    Twitter, 
    Instagram, 
    Linkedin, 
    Youtube, 
    Mail, 
    Headphones, 
    Compass, 
    BookOpen, 
    User, 
    Building2, 
    ShieldCheck, 
    Award, 
    Users, 
    Star, 
    ChevronDown, 
    ChevronUp,
    Heart,
    Lock
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import socialLinks from '../../constants/socialLinks';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Accordion state for mobile link columns
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

    const toggleAccordion = (columnTitle: string) => {
        setActiveAccordion(prev => prev === columnTitle ? null : columnTitle);
    };

    const handleLinkClick = () => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            toast.error('Please enter your email address');
            return;
        }

        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await axios.post(`${API_URL}/api/newsletter/subscribe`, {
                email: email.trim(),
            });

            if (response.data.success) {
                toast.success(response.data.message);
                setEmail('');
            }
        } catch (error: any) {
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to subscribe. Please try again later.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Columns structure
    const columns = [
        {
            title: 'Explore',
            icon: Compass,
            links: [
                { name: 'Browse Courses', path: '/courses/' },
                { name: 'Study Notes', path: '/notes/' },
                { name: 'Online Quizzes', path: '/my-quizzes/' },
                { name: 'Discussion Forum', path: '/doubts/' },
                { name: 'Ask a Doubt', path: '/doubts/submit/' },
            ]
        },
        {
            title: 'Dashboard',
            icon: User,
            links: [
                { name: 'My Dashboard', path: '/dashboard/' },
                { name: 'Enrolled Courses', path: '/dashboard/?tab=courses' },
                { name: 'Subject Notes', path: '/dashboard/?tab=subject-notes' },
                { name: 'Saved Notes', path: '/dashboard/?tab=my-notes' },
                { name: 'Quiz Progress', path: '/dashboard/?tab=quizzes' },
                { name: 'Certificates', path: '/dashboard/?tab=certificates' },
            ]
        },
        {
            title: 'Support',
            icon: Headphones,
            links: [
                { name: 'Contact Us', path: '/contact/' },
                { name: 'Help Desk', path: '/contact/' },
                { name: 'Ask Doubts', path: '/doubts/submit/' },
                { name: 'My Profile', path: '/dashboard/?tab=profile' },
                { name: 'Payment History', path: '/dashboard/?tab=payments' },
            ]
        },
        {
            title: 'Company',
            icon: Building2,
            links: [
                { name: 'About Us', path: '/about/' },
                { name: 'Home Page', path: '/' },
                { name: 'Privacy Policy', path: '/privacy-policy/' },
                { name: 'Student Login', path: '/login/' },
                { name: 'Student Register', path: '/signup/' },
            ]
        }
    ];

    // Trust items
    const trustItems = [
        { icon: ShieldCheck, title: 'SSL Secure', description: '100% Secure Platform' },
        { icon: Award, title: 'Verified Courses', description: 'Accredited Certificates' },
        { icon: Users, title: '50,000+ Students', description: 'Empowered & Learning' },
        { icon: Star, title: '4.9/5 Rating', description: 'Student Satisfaction' }
    ];

    // Anim variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                duration: 0.6, 
                ease: 'easeOut' as const,
                staggerChildren: 0.1
            } 
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.98 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: { duration: 0.4, ease: 'easeOut' as const }
        }
    };

    return (
        <footer className="bg-gradient-to-b from-[#070B18] via-[#0B1224] to-[#121B2F] text-white relative overflow-hidden border-t border-slate-800/80 font-jakarta">
            {/* Top Gold Accent Line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60" />
            
            {/* Luxury Background Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12 pt-[80px] pb-[40px] relative z-10">
                
                {/* Row 1: Brand & Newsletter Side-by-Side (highly compact) */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-white/5"
                >
                    {/* LEFT BRAND SECTION */}
                    <div className="lg:col-span-7 flex flex-col items-start justify-between">
                        <div>
                            {/* Logo */}
                            <Link to="/" className="flex items-center gap-3 mb-4 hover:opacity-90 transition-opacity" onClick={handleLinkClick}>
                                <img
                                    src="/logo_black.png"
                                    alt="Let's Learn and Lead"
                                    className="h-12 w-auto rounded-lg border border-white/10 shadow-lg"
                                />
                                <div className="flex flex-col">
                                    <span className="text-base font-extrabold text-white leading-tight tracking-wide font-jakarta">
                                        Lets <span className="text-[#FFC857]">L-Earn</span> and Lead
                                    </span>
                                    <span className="text-[9px] font-bold text-[#D4AF37] tracking-widest leading-none mt-0.5">
                                        LEARN EARN LEAD
                                    </span>
                                </div>
                            </Link>

                            {/* Large Typography (Scaled for compact luxury layout) */}
                            <div className="mb-4">
                                <h1 className="font-playfair text-[52px] sm:text-[72px] lg:text-[84px] font-extrabold leading-none tracking-tight">
                                    LET'S <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFC857] to-[#D4AF37] bg-clip-text text-transparent">LEARN</span>
                                </h1>
                                <span className="font-caveat text-3xl sm:text-4xl text-[#FFC857]/95 italic mt-1 block ml-2 select-none">
                                    and Lead
                                </span>
                            </div>

                            {/* Tagline */}
                            <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed max-w-[480px] mb-4">
                                Building the Leaders of Tomorrow through quality education, innovation and comprehensive learning experiences.
                            </p>
                        </div>

                        {/* Social Icons */}
                        <div className="flex space-x-3 mt-2">
                            {[
                                { icon: Facebook, url: socialLinks.facebook, name: 'Facebook' },
                                { icon: Instagram, url: socialLinks.instagram, name: 'Instagram' },
                                { icon: Linkedin, url: socialLinks.linkedin, name: 'LinkedIn' },
                                { icon: Twitter, url: socialLinks.twitter, name: 'Twitter' },
                                { icon: Youtube, url: (socialLinks as any).youtube || 'https://youtube.com/@letslearnandlead', name: 'YouTube' }
                            ].map((social, idx) => (
                                <a
                                    key={idx}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-[#9CA3AF] hover:text-white transition-all duration-300 hover:scale-110 hover:rotate-12 hover:border-[#D4AF37]/50 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                                    aria-label={social.name}
                                >
                                    <social.icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT NEWSLETTER & DOWNLOADS */}
                    <div className="lg:col-span-5 flex flex-col justify-between">
                        {/* Newsletter Card */}
                        <div className="w-full bg-[#101827] border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#D4AF37]/5 to-transparent rounded-bl-full pointer-events-none" />
                            
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-[#FFC857]">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <h3 className="text-white font-bold text-base font-jakarta">Stay Updated</h3>
                            </div>
                            
                            <p className="text-xs text-[#9CA3AF] mb-4 leading-relaxed">
                                Subscribe to receive course updates, scholarships, exam notifications and exclusive offers.
                            </p>

                            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isSubmitting}
                                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]/50 text-xs text-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] via-[#FFC857] to-[#D4AF37] text-[#070B18] rounded-xl font-bold hover:shadow-[0_4px_15px_rgba(212,175,55,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer relative overflow-hidden text-xs"
                                    aria-label="Subscribe to newsletter"
                                >
                                    {isSubmitting ? (
                                        <div className="w-3.5 h-3.5 border-2 border-[#070B18] border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <span>Subscribe</span>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Download App Buttons */}
                        <div className="mt-4 flex gap-3">
                            {/* App Store */}
                            <a
                                href="#"
                                className="flex-1 flex items-center justify-center gap-2.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/40 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] group shadow-md"
                            >
                                <svg className="w-5 h-5 text-white group-hover:text-[#FFC857] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71,19.5C17.88,20.74,17,21.95,15.66,22c-1.28.05-1.69-.73-3.15-.73s-1.92.71-3.15.75c-1.33.05-2.28-1.32-3.12-2.52C4.54,16.82,3.22,12,4.89,9.11c.83-1.43,2.3-2.33,3.9-2.36,1.22,0,2.37.85,3.12.85s2.11-.97,3.56-.82a4.77,4.77,0,0,1,3.74,2.08,4.61,4.61,0,0,0-2.22,3.85,4.66,4.66,0,0,0,2.83,4.28A11.75,11.75,0,0,1,18.71,19.5M15.91,4.17a4.65,4.65,0,0,0,1.07-3.33,4.69,4.69,0,0,0-3.07,1.58,4.52,4.52,0,0,0-1.12,3.25A4.32,4.32,0,0,0,15.91,4.17Z" />
                                </svg>
                                <div className="text-left">
                                    <p className="text-[8px] text-[#9CA3AF] uppercase tracking-wider font-bold leading-none">Download on the</p>
                                    <p className="text-[10px] text-white font-extrabold font-jakarta mt-0.5">App Store</p>
                                </div>
                            </a>

                            {/* Google Play */}
                            <a
                                href="#"
                                className="flex-1 flex items-center justify-center gap-2.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/40 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] group shadow-md"
                            >
                                <svg className="w-5 h-5 text-white group-hover:text-[#FFC857] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M5,3.06C4.81,3.06,4.62,3.12,4.47,3.24L13.78,12.56L17.78,8.56L5.69,3.19C5.46,3.1,5.23,3.06,5,3.06M3.25,4.28C3.1,4.5,3,4.77,3,5.09V18.91C3,19.23,3.1,19.5,3.25,19.72L12.59,13.75L3.25,4.28M13.78,14.94L4.47,20.76C4.62,20.88,4.81,20.94,5,20.94C5.23,20.94,5.46,20.9,5.69,20.81L17.78,15.44L13.78,14.94M18.91,8.06L14.94,12L18.91,15.94L21.72,13.72C22.28,13.28,22.28,12.72,21.72,12.28L18.91,8.06Z" />
                                </svg>
                                <div className="text-left">
                                    <p className="text-[8px] text-[#9CA3AF] uppercase tracking-wider font-bold leading-none">Get it on</p>
                                    <p className="text-[10px] text-white font-extrabold font-jakarta mt-0.5">Google Play</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </motion.div>

                {/* Row 2: Help Card & 4 Directories in 5-Column Grid (extremely compact) */}
                <div className="pt-12 pb-12 border-b border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-8 lg:gap-6">
                        
                        {/* COLUMN 1: HELP CARD */}
                        <div className="flex flex-col justify-start">
                            <motion.div 
                                variants={cardVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="w-full bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-xl p-4 hover:border-[#D4AF37]/30 transition-all duration-300 relative overflow-hidden group shadow-lg"
                            >
                                <div className="flex gap-3">
                                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-[#FFC857] h-fit">
                                        <Headphones className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold text-sm mb-0.5">Need Help?</h3>
                                        <p className="text-[11px] text-[#9CA3AF] mb-2 leading-tight">Our support team is available 24/7.</p>
                                        <Link 
                                            to="/contact/" 
                                            className="inline-flex items-center text-[11px] font-bold text-[#FFC857] hover:text-[#D4AF37] transition-colors group/btn"
                                            onClick={handleLinkClick}
                                        >
                                            Contact Support 
                                            <span className="ml-0.5 group-hover/btn:translate-x-1 transition-transform duration-200">→</span>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* COLUMNS 2-5: DIRECTORIES (Compact Lists) */}
                        {columns.map((col) => {
                            const isOpen = activeAccordion === col.title;
                            return (
                                <div key={col.title} className="border-b border-white/5 lg:border-b-0 pb-4 lg:pb-0">
                                    <button
                                        onClick={() => toggleAccordion(col.title)}
                                        className="w-full flex items-center justify-between text-left lg:pointer-events-none mb-3 group"
                                    >
                                        <div className="flex items-center gap-2 text-white font-bold tracking-wide">
                                            <div className="p-1 rounded-lg bg-white/5 border border-white/10 text-[#FFC857] group-hover:scale-105 transition-transform">
                                                <col.icon className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="font-jakarta text-sm">{col.title}</span>
                                        </div>
                                        <span className="lg:hidden text-gray-400 p-1 bg-white/5 border border-white/10 rounded-md">
                                            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </span>
                                    </button>

                                    {/* Desktop view */}
                                    <div className="hidden lg:block">
                                        <ul className="space-y-1.5 pl-1.5">
                                            {col.links.map((link, lIdx) => (
                                                <li key={lIdx}>
                                                    <Link
                                                        to={link.path}
                                                        className="group/link flex items-center text-[#9CA3AF] hover:text-white transition-all duration-300 text-xs relative py-0.5"
                                                        onClick={handleLinkClick}
                                                    >
                                                        <span className="transform group-hover/link:translate-x-3 transition-transform duration-300 flex items-center">
                                                            <span className="absolute -left-3 opacity-0 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-300 text-[#FFC857] text-[10px]">
                                                                →
                                                            </span>
                                                            {link.name}
                                                        </span>
                                                        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gradient-to-r from-[#D4AF37] to-[#FFC857] group-hover/link:w-full transition-all duration-300" />
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Mobile View Accordion */}
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden lg:hidden"
                                            >
                                                <ul className="space-y-2 pl-2 pt-1 pb-1">
                                                    {col.links.map((link, lIdx) => (
                                                        <li key={lIdx}>
                                                            <Link
                                                                to={link.path}
                                                                className="group/link flex items-center text-[#9CA3AF] hover:text-white transition-all duration-300 text-xs py-1"
                                                                onClick={handleLinkClick}
                                                            >
                                                                <span>{link.name}</span>
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}

                    </div>
                </div>

                {/* TRUST BAR (Compact, slim card layout) */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="pt-8 pb-8"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {trustItems.map((item, idx) => (
                            <div
                                key={idx}
                                className="bg-white/[0.01] backdrop-blur-md border border-white/5 rounded-xl p-3 flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/20 hover:shadow-[0_4px_15px_rgba(212,175,55,0.08)] group cursor-pointer"
                            >
                                <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-[#FFC857] group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-xs leading-none group-hover:text-[#FFC857] transition-colors">{item.title}</h4>
                                    <p className="text-[#9CA3AF] text-[10px] mt-0.5 leading-none">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* BOTTOM BAR (Ultra-sleek) */}
                <div className="border-t border-white/5 pt-6 mt-4 flex flex-col items-center">
                    
                    {/* Top row of bottom bar */}
                    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9CA3AF] pb-4">
                        {/* Left: SSL status */}
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-semibold text-[#FFC857]">
                            <Lock className="w-3 h-3" />
                            <span>SSL Secure Platform</span>
                        </div>

                        {/* Middle: Copyright */}
                        <div className="text-center font-medium">
                            &copy; {currentYear} Let's Learn and Lead. All Rights Reserved.
                        </div>

                        {/* Right: Credits */}
                        <div className="flex items-center gap-1 text-[10px]">
                            <span>Made with</span>
                            <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
                            <span>for Learners.</span>
                        </div>
                    </div>

                    {/* Bottom row: Legal links */}
                    <div className="w-full border-t border-white/[0.03] pt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[10px] text-[#9CA3AF]">
                        {[
                            { name: 'About Us', path: '/about/' },
                            { name: 'Contact Us', path: '/contact/' },
                            { name: 'Privacy Policy', path: '/privacy-policy/' },
                            { name: 'Browse Courses', path: '/courses/' },
                            { name: 'Study Notes', path: '/notes/' },
                            { name: 'Discussion Forum', path: '/doubts/' },
                            { name: 'My Dashboard', path: '/dashboard/' }
                        ].map((link, idx) => (
                            <Link
                                key={idx}
                                to={link.path}
                                className="hover:text-[#FFC857] transition-colors relative group py-0.5"
                                onClick={handleLinkClick}
                            >
                                {link.name}
                                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#D4AF37] group-hover:w-full transition-all duration-300" />
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
