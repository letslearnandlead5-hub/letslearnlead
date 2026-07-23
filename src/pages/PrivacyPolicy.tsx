import React, { useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { Shield, Lock, Eye, Database, Mail, Phone, FileText, AlertCircle, Users, Trash2 } from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

interface SectionProps {
  icon: React.FC<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  index: number;
  color: string;
}

const Section: React.FC<SectionProps> = ({ icon: Icon, title, children, index, color }) => (
  <motion.div
    custom={index}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-40px' }}
    variants={fadeUp}
    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
  >
    <div className={`flex items-center gap-3 px-6 py-4 ${color}`}>
      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
    </div>
    <div className="px-6 py-5 text-gray-600 dark:text-gray-300 text-sm leading-relaxed space-y-3">
      {children}
    </div>
  </motion.div>
);

const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Privacy Policy — Let's Learn";
  }, []);

  const lastUpdated = 'July 24, 2026';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 220 + 40}px`,
                height: `${Math.random() * 220 + 40}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-white/25"
          >
            <Shield className="w-4 h-4" />
            Your Privacy Matters
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55 }}
            className="text-4xl md:text-5xl font-extrabold text-white mb-4"
          >
            Privacy Policy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-indigo-100 text-lg max-w-2xl mx-auto mb-6"
          >
            We are committed to protecting your personal information and your right to privacy. This policy explains how we collect, use, and safeguard your data.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs px-4 py-2 rounded-full border border-white/20"
          >
            <FileText className="w-3.5 h-3.5" />
            Last Updated: {lastUpdated}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-14 space-y-6">

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-6 text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed"
        >
          <strong>Let's Learn</strong> ("we", "us", or "our") operates the Let's Learn online learning platform accessible via our website and mobile application. This Privacy Policy applies to all users of our platform, including students, teachers, and visitors. By using our services, you agree to the collection and use of information in accordance with this policy.
        </motion.div>

        <Section index={0} icon={Database} title="1. Information We Collect" color="bg-gradient-to-r from-blue-600 to-blue-500">
          <p>We collect information you provide directly to us when you:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Create an account (name, email address, phone number, password)</li>
            <li>Enroll in a course or purchase a subject</li>
            <li>Submit doubts, complete quizzes, or access study materials</li>
            <li>Contact us through our support channels</li>
          </ul>
          <p className="mt-3">We also automatically collect:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Device information (device type, operating system, app version)</li>
            <li>Usage data (pages visited, videos watched, quiz attempts, login timestamps)</li>
            <li>IP address and general location (country/region)</li>
            <li>Authentication tokens stored securely on your device</li>
          </ul>
        </Section>

        <Section index={1} icon={Eye} title="2. How We Use Your Information" color="bg-gradient-to-r from-purple-600 to-purple-500">
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Create and manage your student account</li>
            <li>Verify your enrollment and grant access to purchased courses and study materials</li>
            <li>Deliver video lessons, study notes (PDFs), and quizzes securely</li>
            <li>Process course payments and maintain payment records</li>
            <li>Send important notifications about your courses, doubts, and results</li>
            <li>Provide customer support and respond to your queries</li>
            <li>Improve our platform, content quality, and user experience</li>
            <li>Prevent fraud, unauthorized access, and abuse of our platform</li>
          </ul>
        </Section>

        <Section index={2} icon={Lock} title="3. Data Security" color="bg-gradient-to-r from-green-600 to-green-500">
          <p>We take data security seriously and implement industry-standard measures including:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>JWT Authentication</strong> — all sessions are secured with signed JSON Web Tokens</li>
            <li><strong>Encrypted Storage</strong> — access tokens are stored in device secure storage (not plain AsyncStorage)</li>
            <li><strong>HTTPS</strong> — all data transmission is encrypted using TLS/SSL</li>
            <li><strong>Secure PDF Streaming</strong> — study notes are streamed via short-lived signed tokens and never permanently downloaded</li>
            <li><strong>Password Hashing</strong> — passwords are hashed using bcrypt and never stored in plain text</li>
            <li><strong>Rate Limiting</strong> — our APIs are protected against brute-force attacks</li>
          </ul>
          <p className="mt-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            While we implement these safeguards, no method of transmission over the internet is 100% secure. We encourage you to use a strong, unique password for your account.
          </p>
        </Section>

        <Section index={3} icon={Users} title="4. Sharing of Information" color="bg-gradient-to-r from-orange-600 to-orange-500">
          <p>We do <strong>not sell, trade, or rent</strong> your personal information to third parties. We may share information with:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Payment processors</strong> — to facilitate course payments (only transaction-relevant data)</li>
            <li><strong>Cloud infrastructure providers</strong> — for hosting and data storage (under confidentiality agreements)</li>
            <li><strong>Legal authorities</strong> — if required by law or to protect our legal rights</li>
          </ul>
          <p className="mt-3">Our teachers and admins can view enrollment details and course access records strictly for educational purposes.</p>
        </Section>

        <Section index={4} icon={Shield} title="5. Cookies & Tracking" color="bg-gradient-to-r from-teal-600 to-teal-500">
          <p>Our website uses:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Session cookies</strong> — to keep you logged in during your browsing session</li>
            <li><strong>Refresh token cookies</strong> — for secure automatic session renewal (HttpOnly, Secure)</li>
            <li><strong>Local storage</strong> — to remember your theme preference (dark/light mode)</li>
          </ul>
          <p className="mt-3">We do not use advertising trackers, Google Analytics, or any third-party behavioral tracking cookies.</p>
        </Section>

        <Section index={5} icon={FileText} title="6. Data Retention" color="bg-gradient-to-r from-cyan-600 to-cyan-500">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Account data is retained as long as your account is active</li>
            <li>Course enrollment and payment records are retained for legal and accounting compliance (minimum 3 years)</li>
            <li>Quiz attempt logs and learning progress are retained to support your academic history</li>
            <li>Upon account deletion, personal data is anonymized or permanently removed within 30 days</li>
          </ul>
        </Section>

        <Section index={6} icon={Trash2} title="7. Your Rights" color="bg-gradient-to-r from-rose-600 to-rose-500">
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Access</strong> — request a copy of your personal data we hold</li>
            <li><strong>Correction</strong> — update your name, email, or profile information at any time from your account settings</li>
            <li><strong>Deletion</strong> — request deletion of your account and associated personal data</li>
            <li><strong>Portability</strong> — request your data in a structured, commonly used format</li>
            <li><strong>Withdrawal</strong> — withdraw consent for communications at any time</li>
          </ul>
          <p className="mt-3">To exercise any of these rights, contact us at the email address below.</p>
        </Section>

        <Section index={7} icon={Phone} title="8. Children's Privacy" color="bg-gradient-to-r from-amber-600 to-amber-500">
          <p>Our platform is designed for students and learners. We do not knowingly collect personal information from children under 13 years of age without verifiable parental consent.</p>
          <p>If you believe we have inadvertently collected data from a child under 13, please contact us immediately so we can promptly remove the information.</p>
        </Section>

        <Section index={8} icon={FileText} title="9. Changes to This Policy" color="bg-gradient-to-r from-indigo-600 to-violet-500">
          <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Posting the new Privacy Policy on this page with an updated "Last Updated" date</li>
            <li>Sending an in-app notification or email for material changes</li>
          </ul>
          <p className="mt-3">Your continued use of the platform after changes are posted constitutes your acceptance of the revised policy.</p>
        </Section>

        {/* Contact Card */}
        <motion.div
          custom={9}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white shadow-xl"
        >
          <Mail className="w-10 h-10 mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl font-bold mb-2">Contact Us</h2>
          <p className="text-indigo-100 text-sm mb-6 max-w-md mx-auto">
            If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please reach out to us.
          </p>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Let's Learn</p>
            <a
              href="mailto:support@letslearnlead.com"
              className="block text-indigo-200 hover:text-white transition-colors underline underline-offset-2"
            >
              support@letslearnlead.com
            </a>
            <a
              href="/contact/"
              className="inline-block mt-3 bg-white text-indigo-700 font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Contact Us →
            </a>
          </div>
        </motion.div>

        {/* Bottom note */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-4">
          © {new Date().getFullYear()} Let's Learn. All rights reserved. &nbsp;|&nbsp; Last updated: {lastUpdated}
        </p>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
