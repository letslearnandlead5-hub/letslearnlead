import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Award,
    Download,
    Share2,
    Calendar,
    BookOpen,
    CheckCircle,
    ExternalLink,
    Linkedin,
    FileText,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { courseAPI } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { staggerContainer, staggerItem } from '../../utils/animations';

interface Certificate {
    _id: string;
    courseId: {
        _id: string;
        title: string;
        category: string;
        instructor: string;
    };
    studentName: string;
    completionDate: string;
    certificateNumber: string;
    grade?: string;
    skills: string[];
}

const MyCertificates: React.FC = () => {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const { user } = useAuthStore();
    const { addToast } = useToastStore();

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            // This would be replaced with actual certificates API
            // For now, showing empty state for fresh student account
            setCertificates([]);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching certificates:', error);
            addToast({ type: 'error', message: 'Failed to load certificates' });
            setLoading(false);
        }
    };

    const handleDownloadCertificate = (_certificate: Certificate) => {
        // In real app, this would generate and download PDF
        addToast({ type: 'success', message: 'Certificate downloaded successfully!' });
    };

    const handleViewCertificate = (certificate: Certificate) => {
        setSelectedCertificate(certificate);
        setIsPreviewOpen(true);
    };

    const handleShareCertificate = (certificate: Certificate) => {
        setSelectedCertificate(certificate);
        setIsShareOpen(true);
    };

    const handleShareLinkedIn = () => {
        if (!selectedCertificate) return;
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
        window.open(url, '_blank');
        addToast({ type: 'success', message: 'Opening LinkedIn share...' });
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        addToast({ type: 'success', message: 'Certificate link copied to clipboard!' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Certificates</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        View and download your earned certificates
                    </p>
                </div>

                {/* Stats */}
                <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="grid md:grid-cols-3 gap-6 mb-8"
                >
                    <motion.div variants={staggerItem}>
                        <Card className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                    <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Certificates</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {certificates.length}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <Card className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Courses Completed</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {certificates.length}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <Card className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Skills Earned</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {new Set(certificates.flatMap(c => c.skills)).size}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </motion.div>

                {/* Certificates Grid */}
                {certificates.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No Certificates Yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Complete courses to earn certificates and showcase your achievements!
                        </p>
                    </Card>
                ) : (
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {certificates.map((certificate) => (
                            <motion.div key={certificate._id} variants={staggerItem}>
                                <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                                    <div className="relative h-48 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 p-6 flex flex-col justify-between">
                                        <div>
                                            <Award className="w-12 h-12 text-white mb-2" />
                                            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                                                {certificate.courseId.category}
                                            </Badge>
                                        </div>
                                        <div className="text-white">
                                            <p className="text-sm opacity-90">Certificate of Completion</p>
                                            <p className="text-xs opacity-75 mt-1">
                                                {certificate.certificateNumber}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                            {certificate.courseId.title}
                                        </h3>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                    Completed: {new Date(certificate.completionDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <BookOpen className="w-4 h-4" />
                                                <span>Instructor: {certificate.courseId.instructor}</span>
                                            </div>
                                            {certificate.grade && (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="success">Grade: {certificate.grade}</Badge>
                                                </div>
                                            )}
                                        </div>

                                        {/* Skills */}
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Skills Earned:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {certificate.skills.map((skill, index) => (
                                                    <Badge key={index} variant="secondary" className="text-xs">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="flex-1"
                                                leftIcon={<Download className="w-4 h-4" />}
                                                onClick={() => handleDownloadCertificate(certificate)}
                                            >
                                                Download
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewCertificate(certificate)}
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleShareCertificate(certificate)}
                                            >
                                                <Share2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Certificate Preview Modal */}
            <Modal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title="Certificate Preview"
                size="xl"
            >
                {selectedCertificate && (
                    <div className="p-6">
                        {/* Certificate Design */}
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-8 border-yellow-600 dark:border-yellow-700 rounded-lg p-12 text-center">
                            <div className="mb-6">
                                <Award className="w-20 h-20 text-yellow-600 mx-auto mb-4" />
                                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                    Certificate of Completion
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    This is to certify that
                                </p>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-3xl font-bold text-primary-600 mb-4">
                                    {selectedCertificate.studentName}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                    has successfully completed the course
                                </p>
                                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    {selectedCertificate.courseId.title}
                                </h4>
                            </div>

                            <div className="grid grid-cols-3 gap-8 mb-6 text-sm">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-1">Completion Date</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {new Date(selectedCertificate.completionDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-1">Certificate Number</p>
                                    <p className="font-mono font-semibold text-gray-900 dark:text-white">
                                        {selectedCertificate.certificateNumber}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-1">Grade</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {selectedCertificate.grade || 'Pass'}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t-2 border-yellow-600 dark:border-yellow-700 pt-6">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Instructor</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {selectedCertificate.courseId.instructor}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="primary"
                                leftIcon={<Download className="w-4 h-4" />}
                                onClick={() => handleDownloadCertificate(selectedCertificate)}
                                className="flex-1"
                            >
                                Download PDF
                            </Button>
                            <Button
                                variant="outline"
                                leftIcon={<Share2 className="w-4 h-4" />}
                                onClick={() => {
                                    setIsPreviewOpen(false);
                                    setIsShareOpen(true);
                                }}
                                className="flex-1"
                            >
                                Share Certificate
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Share Modal */}
            <Modal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                title="Share Certificate"
                size="md"
            >
                {selectedCertificate && (
                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {selectedCertificate.courseId.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Share your achievement with the world!
                            </p>
                        </div>

                        <div className="space-y-3">
                            {/* LinkedIn */}
                            <button
                                onClick={handleShareLinkedIn}
                                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                            >
                                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <Linkedin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-semibold text-gray-900 dark:text-white">Share on LinkedIn</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Add to your LinkedIn profile
                                    </p>
                                </div>
                                <ExternalLink className="w-5 h-5 text-gray-400" />
                            </button>

                            {/* Copy Link */}
                            <button
                                onClick={handleCopyLink}
                                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors"
                            >
                                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-semibold text-gray-900 dark:text-white">Copy Link</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Share via link or add to resume
                                    </p>
                                </div>
                            </button>

                            {/* Download for Portfolio */}
                            <button
                                onClick={() => handleDownloadCertificate(selectedCertificate)}
                                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
                            >
                                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-semibold text-gray-900 dark:text-white">Download PDF</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Add to your resume or portfolio
                                    </p>
                                </div>
                            </button>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Tip:</strong> Adding certificates to your LinkedIn profile and resume can help you stand out to employers and showcase your continuous learning!
                            </p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MyCertificates;
