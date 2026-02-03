import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import Button from '../ui/Button';
import { useContentProtection } from '../../hooks/useContentProtection';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';

// Set up the worker for PDF.js - use unpkg CDN (more reliable than cdnjs)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
    };

    const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
    const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    return (
        <div className={`relative ${className}`}>
            {/* PDF Controls */}
            <div className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 p-3 flex items-center justify-between gap-4">
                {/* Page Info */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300 px-3">
                        Total Pages: {numPages}
                    </span>
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

            {/* PDF Document Viewer - Continuous Scroll */}
            <div
                className={`protected-content overflow-auto bg-gray-200 dark:bg-gray-900 ${
                    isFullscreen ? 'fixed inset-0 z-50 pt-16' : 'mt-0'
                }`}
                style={{
                    height: isFullscreen ? '100vh' : 'calc(100vh - 200px)',
                    userSelect: 'none',
                }}
            >
                <div className="flex flex-col items-center p-8 space-y-4">
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
                        {/* Render all pages in continuous scroll */}
                        {Array.from(new Array(numPages), (el, index) => (
                            <div key={`page_${index + 1}`} className="relative mb-4">
                                {/* Page Number Label */}
                                <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
                                    Page {index + 1}
                                </div>

                                {/* Watermark for each page */}
                                <div
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    style={{
                                        opacity: 0.1,
                                        transform: 'rotate(-45deg)',
                                        zIndex: 5,
                                    }}
                                >
                                    <div className="text-4xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                        {user?.name || 'PROTECTED'}
                                        <br />
                                        {user?.email}
                                    </div>
                                </div>

                                <Page
                                    pageNumber={index + 1}
                                    scale={scale}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    className="shadow-2xl"
                                />
                            </div>
                        ))}
                    </Document>
                </div>
            </div>
        </div>
    );
};

export default ProtectedPDFViewer;
