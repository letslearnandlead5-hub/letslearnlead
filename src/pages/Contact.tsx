import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Clock, MessageCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { useToastStore } from '../store/useToastStore';
import meetTeamSvg from '../assets/Meet-the-team.svg';

const Contact: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToastStore();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        setTimeout(() => {
            addToast({
                type: 'success',
                message: 'Message sent successfully! We\'ll get back to you soon.',
            });
            setFormData({ name: '', email: '', subject: '', message: '' });
            setIsSubmitting(false);
        }, 1500);
    };

    const contactInfo = [
        {
            icon: Mail,
            title: 'Email Us',
            content: 'letslearnandlead5@gmail.com',
            description: 'Send us an email anytime!',
        },
        {
            icon: Phone,
            title: 'Call Us',
            content: '9916312101',
            description: 'Mon-Fri from 8am to 6pm',
        },
        {
            icon: MapPin,
            title: 'Visit Us',
            content: '#981/C Shankar nagar, Athani, Pincode 591304',
            description: 'Come say hello at our office',
        },
        {
            icon: Clock,
            title: 'Business Hours',
            content: 'Mon - Fri: 8:00 AM - 6:00 PM',
            description: 'Weekend: 10:00 AM - 4:00 PM',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-900 dark:via-gray-950 dark:to-primary-950/20 py-16">
            <div className="container mx-auto px-4">
                {/* Header with Illustration */}
                <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-left"
                    >
                        <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
                            Get In Touch
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </motion.div>

                    {/* Team Illustration */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex justify-center items-center"
                    >
                        <motion.div
                            animate={{
                                y: [0, -10, 0]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="w-full max-w-md"
                        >
                            <img
                                src={meetTeamSvg}
                                alt="Meet Our Team"
                                className="w-full h-auto drop-shadow-2xl"
                            />
                        </motion.div>
                    </motion.div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 mb-16">
                    {/* Contact Information Cards */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-1 space-y-6"
                    >
                        {contactInfo.map((info, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                            >
                                <div className="flex items-start space-x-4">
                                    <div className="p-3 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl">
                                        <info.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                            {info.title}
                                        </h3>
                                        <p className="text-primary-600 dark:text-primary-400 font-medium mb-1">
                                            {info.content}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {info.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Social Links or Additional Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl p-6 text-white"
                        >
                            <MessageCircle className="w-8 h-8 mb-3" />
                            <h3 className="text-xl font-bold mb-2">Need Quick Help?</h3>
                            <p className="text-primary-100 mb-4">
                                Check out our FAQ section or join our community forum for instant answers!
                            </p>
                            <Button variant="secondary" size="sm" className="w-full">
                                Visit FAQ
                            </Button>
                        </motion.div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-2"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                Send us a Message
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                            placeholder="name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        placeholder="How can we help?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                                        placeholder="Tell us more about your inquiry..."
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    disabled={isSubmitting}
                                    className="w-full group"
                                >
                                    {isSubmitting ? (
                                        <span>Sending...</span>
                                    ) : (
                                        <>
                                            <span>Send Message</span>
                                            <Send className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                </div>

                {/* Map Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700"
                >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Find Us On The Map
                    </h2>
                    <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3843.8!2d75.0567!3d16.7208!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc6f7b6c7f8e7bf%3A0x1f9a0c1d3f4b5e6d!2sShankar%20Nagar%2C%20Athani%2C%20Karnataka%20591304!5e0!3m2!1sen!2sin!4v1234567890"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Office Location - #981/C Shankar nagar, Athani"
                        ></iframe>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            📍 #981/C Shankar nagar, Athani, Pincode 591304
                        </p>
                        <a
                            href="https://www.google.com/maps/place/Shankar+Nagar,+Athani,+Karnataka+591304"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium inline-flex items-center gap-1"
                        >
                            Open in Google Maps →
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Contact;
