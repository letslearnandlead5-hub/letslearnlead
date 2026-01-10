import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Clock, Mail } from 'lucide-react';

const Maintenance: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl w-full text-center"
            >
                {/* Icon */}
                <motion.div
                    animate={{
                        rotate: [0, -10, 10, -10, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                    }}
                    className="inline-block mb-8"
                >
                    <div className="w-32 h-32 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <Wrench className="w-16 h-16 text-primary-600 dark:text-primary-400" />
                    </div>
                </motion.div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                    Under Maintenance
                </h1>

                {/* Description */}
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                    We're currently performing scheduled maintenance to improve your experience.
                    We'll be back shortly!
                </p>

                {/* Info Cards */}
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                    >
                        <Clock className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Expected Duration
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            We expect to be back online within a few hours
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                    >
                        <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Need Help?
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Contact us at support@letslearnandlead.com
                        </p>
                    </motion.div>
                </div>

                {/* Loading Animation */}
                <div className="flex justify-center gap-2">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                            className="w-3 h-3 bg-primary-600 dark:bg-primary-400 rounded-full"
                        />
                    ))}
                </div>

                {/* Footer */}
                <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
                    Thank you for your patience!
                </p>
            </motion.div>
        </div>
    );
};

export default Maintenance;
