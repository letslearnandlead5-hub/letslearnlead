import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import socialLinks from '../../constants/socialLinks';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic email validation
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
            const response = await axios.post('http://localhost:5000/api/newsletter/subscribe', {
                email: email.trim(),
            });

            if (response.data.success) {
                toast.success(response.data.message);
                setEmail(''); // Clear the input
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

    return (
        <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div>
                        <Link to="/" className="flex items-center space-x-3 mb-4">
                            <img
                                src="/logo.png"
                                alt="Let's L-Earn and Lead"
                                className="h-12 w-auto"
                            />
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-white leading-tight">
                                    Lets <span className="text-yellow-500">L-Earn</span> and Lead
                                </span>
                                <span className="text-xs font-semibold text-yellow-600 tracking-widest leading-tight">
                                    LEARN EARN LEAD
                                </span>
                            </div>
                        </Link>
                        <p className="text-sm text-gray-400 mb-4">
                            Building the Leaders of Tomorrow through quality education and comprehensive learning programs.
                        </p>
                        <div className="flex space-x-3">
                            <a
                                href={socialLinks.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-primary-500 transition-colors"
                                aria-label="Facebook"
                            >
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a
                                href={socialLinks.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-primary-500 transition-colors"
                                aria-label="Twitter"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href={socialLinks.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-primary-500 transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a
                                href={socialLinks.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-primary-500 transition-colors"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/courses" className="hover:text-primary-500 transition-colors">
                                    Courses
                                </Link>
                            </li>
                            <li>
                                <Link to="/notes" className="hover:text-primary-500 transition-colors">
                                    Notes Library
                                </Link>
                            </li>
                            <li>
                                <Link to="/shop" className="hover:text-primary-500 transition-colors">
                                    Shop
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="hover:text-primary-500 transition-colors">
                                    About Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Resources</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/contact" className="hover:text-primary-500 transition-colors">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/help" className="hover:text-primary-500 transition-colors">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="hover:text-primary-500 transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="hover:text-primary-500 transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link to="/signup" className="hover:text-primary-500 transition-colors">
                                    Get Started
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Newsletter</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Subscribe to get updates on new courses and offers.
                        </p>
                        <form onSubmit={handleNewsletterSubmit} className="flex">
                            <input
                                type="email"
                                placeholder="Your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isSubmitting}
                                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Subscribe to newsletter"
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Mail className="w-4 h-4" />
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center text-gray-400">
                    <p>&copy; {currentYear} Let's L-Earn and Lead. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
