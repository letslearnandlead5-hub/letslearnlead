import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, BookOpen, Users, Award, Heart } from 'lucide-react';
import Card from '../components/ui/Card';

const AboutUs: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    const features = [
        {
            icon: Target,
            title: 'Our Mission',
            description: 'Our mission is to build a sustainable model and strong foundation through building leadership and upskilling our rural students.',
            color: 'from-blue-500 to-blue-600',
        },
        {
            icon: Eye,
            title: 'Our Vision',
            description: 'Our vision is to create and sustain a collective professional learning ecosystem that supports the needs of the students, thereby developing the future leaders.',
            color: 'from-purple-500 to-purple-600',
        },
        {
            icon: BookOpen,
            title: 'Our Publications',
            description: 'Innovative and easy to learn study materials for better understanding by our sister concern S.S publication.',
            color: 'from-green-500 to-green-600',
        },
    ];

    const values = [
        {
            icon: Users,
            title: 'Expert Educators',
            description: 'We collaborate with leading and expert educators of the respective fields who provide excellent education.',
        },
        {
            icon: Award,
            title: 'Quality Content',
            description: 'We offer a variety of learning and knowledge materials which are constantly improvised.',
        },
        {
            icon: Heart,
            title: 'Dedicated Support',
            description: 'We believe in providing great content and service. We are here to help you in any way.',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-yellow-50 to-white dark:from-gray-900 dark:to-gray-950 py-20">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                            Welcome to Let's Learn and Lead
                        </h1>
                        <div className="h-1 w-24 bg-gradient-to-r from-yellow-500 to-yellow-600 mx-auto mb-8"></div>
                        <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                            Building the Leaders of Tomorrow
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* About Us Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
                            About Us
                        </h2>
                        <div className="space-y-6 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                            <p>
                                Let's Learn and Lead.com is an innovative learning platform, which is specially designed for the
                                students of rural area who are learning in their regional languages. Our goal is to provide valuable
                                learning experience with emphasis on soft skill development.
                            </p>
                            <p>
                                We collaborate with leading and expert educators of the respective fields who provide excellent
                                education. We offer a variety of learning and knowledge materials which are constantly improvised.
                            </p>
                            <p>
                                We believe in providing great content and service. We are here to help you in any way. Contact us
                                anytime.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Mission, Vision, Publications */}
            <section className="py-16 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="p-8 h-full hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-yellow-500">
                                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                                        <feature.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            What Makes Us Different
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Our commitment to excellence and student success sets us apart
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {values.map((value, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <value.icon className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                    {value.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {value.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-3xl mx-auto"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Ready to Start Your Learning Journey?
                        </h2>
                        <p className="text-xl mb-8 text-yellow-50">
                            Join thousands of students who are building their future with us
                        </p>
                        <div className="flex gap-4 justify-center">
                            <a
                                href="/courses"
                                className="px-8 py-3 bg-white text-yellow-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Explore Courses
                            </a>
                            <a
                                href="https://wa.me/919916312101"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-yellow-600 transition-colors"
                            >
                                Contact Us
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
