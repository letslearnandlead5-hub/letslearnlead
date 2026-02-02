import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import Button from '../ui/Button';
import { useContentProtection } from '../../hooks/useContentProtection';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
// import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up the worker for PDF.js using CDN
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface ProtectedPDFViewerProps {
    fileUrl: string;
    fileName?: string;
    className?: string;
}

const ProtectedPDFViewer: React.FC<ProtectedPDFViewerProps> = ({
    fileUrl,
    fileName = 'Document',
    className = '',
}) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { user } = useAuthStore();
    const { addToast } = useToastStore();

    // Enable content protection
    useContentProtection({
        onRightClick: () => {
            addToast({
                type: 'warning',
                message: 'Right-click is disabled on protected content',
            });
        },
        onKeyboardShortcut: (key) => {
            if (key === 'print') {
                addToast({
                    type: 'warning',
                    message: 'Printing is disabled for protected content',
                });
            } else if (key === 'save' || key === 'save-as') {
                addToast({
                    type: 'warning',
                    message: 'Downloading is disabled for protected content',
                });
            }
        },
    });

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPageNumber(1);
    };

    const changePage = (offset: number) => {
        setPageNumber((prevPageNumber) => {
            const newPage = prevPageNumber + offset;
            return Math.min(Math.max(1, newPage), numPages);
        });
    };

    const previousPage = () => changePage(-1);
    const nextPage = () => changePage(1);

    const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
    const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    return (
        <div className={`relative ${className}`}>
            {/* Watermark Overlay */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-yellow-50 dark:bg-yellow-950 border-b-2 border-yellow-500 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                            🔒 Protected Content
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            Viewing as: <strong>{user?.name || 'Student'}</strong> ({user?.email})
                        </p>
                    </div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300">
                        ⚠️ Printing and downloading disabled
                    </div>
                </div>
            </div>

            {/* PDF Controls */}
            <div className="sticky top-20 z-10 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 p-3 flex items-center justify-between gap-4">
                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={previousPage}
                        disabled={pageNumber <= 1}
                        leftIcon={<ChevronLeft className="w-4 h-4" />}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-gray-700 dark:text-gray-300 px-3">
                        Page {pageNumber} of {numPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={nextPage}
                        disabled={pageNumber >= numPages}
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                    >
                        Next
                    </Button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={zoomOut}
                        disabled={scale <= 0.5}
                    >
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={zoomIn}
                        disabled={scale >= 3.0}
                    >
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFullscreen}
                    >
                        <Maximize2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* PDF Document Viewer */}
            <div
                className={`protected-content overflow-auto bg-gray-200 dark:bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50 pt-32' : 'mt-0'
                    }`}
                style={{
                    height: isFullscreen ? '100vh' : '600px',
                    userSelect: 'none',
                }}
            >
                <div className="flex justify-center p-8">
                    <div className="relative">
                        {/* Visible Watermark on PDF */}
                        <div
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            style={{
                                opacity: 0.15,
                                transform: 'rotate(-45deg)',
                                zIndex: 5,
                            }}
                        >
                            <div className="text-6xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                {user?.name || 'PROTECTED'}
                                <br />
                                {user?.email}
                            </div>
                        </div>

                        <Document
                            file={fileUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={
                                <div className="flex items-center justify-center h-96">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                                </div>
                            }
                            error={
                                <div className="flex items-center justify-center h-96">
                                    <div className="text-center">
                                        <p className="text-red-600 font-semibold mb-2">
                                            Failed to load PDF
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Please try refreshing the page
                                        </p>
                                    </div>
                                </div>
                            }
                        >
                            <Page
                                pageNumber={pageNumber}
                                scale={scale}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="shadow-2xl"
                            />
                        </Document>
                    </div>
                </div>
            </div>

            {/* Bottom Watermark */}
            <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 p-2 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                    This content is protected and can only be viewed while logged in. Unauthorized distribution is prohibited.
                </p>
            </div>
        </div>
    );
};

export default ProtectedPDFViewer;
