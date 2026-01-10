import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const StudentFooter: React.FC = () => {
    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
            <div className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <img
                                src="/logo.png"
                                alt="Let's L-earn and Lead"
                                className="h-10 w-auto"
                            />
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                    Lets <span className="text-yellow-500">L-Earn</span> and Lead
                                </span>
                                <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 tracking-widest leading-tight">
                                    LEARN EARN LEAD
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Empowering students to learn and lead in their educational journey.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                                    My Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link to="/courses" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                                    Browse Courses
                                </Link>
                            </li>
                            <li>
                                <Link to="/notes" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                                    Study Notes
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                                    About Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contact</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Mail className="w-4 h-4" />
                                <span>support@learnandlead.com</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Phone className="w-4 h-4" />
                                <span>+91 1234567890</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span>India</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        © {new Date().getFullYear()} Let's L-earn and Lead. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default StudentFooter;
