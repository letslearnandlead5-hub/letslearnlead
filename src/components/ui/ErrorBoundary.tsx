import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Button from './Button';
import Card from './Card';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
        window.location.href = '/';
    };

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">
                    <motion.div
                        className="container max-w-2xl mx-auto"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <Card className="p-8">
                            <div className="text-center mb-8">
                                <motion.div
                                    className="w-24 h-24 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6"
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                                >
                                    <AlertTriangle className="w-14 h-14 text-white" />
                                </motion.div>
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                    Oops! Something went wrong
                                </h1>
                                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                                    We encountered an unexpected error. Don't worry, we're on it!
                                </p>
                            </div>

                            {import.meta.env.DEV && this.state.error && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-xl">
                                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                                        Error Details (Development Mode)
                                    </h3>
                                    <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap overflow-auto max-h-64">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo && '\n\n' + this.state.errorInfo.componentStack}
                                    </pre>
                                </div>
                            )}

                            <div className="space-y-4 mb-6">
                                <h3 className="font-semibold text-lg">What you can do:</h3>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-600 mt-1">•</span>
                                        <span>Refresh the page to try again</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-600 mt-1">•</span>
                                        <span>Go back to the home page</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-600 mt-1">•</span>
                                        <span>Clear your browser cache and cookies</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-600 mt-1">•</span>
                                        <span>Contact support if the problem persists</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="flex-1"
                                    onClick={this.handleReload}
                                    leftIcon={<RefreshCcw className="w-5 h-5" />}
                                >
                                    Refresh Page
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="flex-1"
                                    onClick={this.handleReset}
                                    leftIcon={<Home className="w-5 h-5" />}
                                >
                                    Go Home
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
