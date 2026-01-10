import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    ChevronRight,
    FileText,
    AlertCircle,
    CheckCircle2,
    Circle,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { courseAPI } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';


const VideoPlayer: React.FC = () => {
    const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const { token } = useAuthStore(); // Get token from auth store

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());
    const [currentLesson, setCurrentLesson] = useState<any>(null);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => {
        // Load from localStorage on mount
        const saved = localStorage.getItem(`course-${courseId}-completed`);
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });
    const [youtubeWatchTime, setYoutubeWatchTime] = useState(0);
    const [youtubeDuration, setYoutubeDuration] = useState(0);

    // Fetch course data
    useEffect(() => {
        const fetchCourse = async () => {
            try {
                if (!courseId) return;

                const response: any = await courseAPI.getById(courseId);
                setCourse(response.data);
            } catch (error) {
                console.error('Error fetching course:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    // Find current lesson based on lessonId
    useEffect(() => {
        if (!course || !lessonId) return;

        let foundLesson = null;
        for (const section of course.sections || []) {
            for (const subsection of section.subsections || []) {
                for (const item of subsection.content || []) {
                    if (item._id === lessonId) {
                        foundLesson = item;
                        break;
                    }
                }
                if (foundLesson) break;
            }
            if (foundLesson) break;
        }
        setCurrentLesson(foundLesson);
    }, [course, lessonId]);

    // Sync progress to backend
    const syncProgressToBackend = async (newCompletedSet: Set<string>) => {
        console.log('🔄 syncProgressToBackend called');
        console.log('   completedLessons:', newCompletedSet.size);
        console.log('   course exists:', !!course);
        console.log('   courseId:', courseId);

        if (!course?.sections || !courseId) {
            console.log('❌ Sync aborted - missing data');
            return;
        }

        // Calculate completion percentage
        let totalLessons = 0;
        for (const section of course.sections) {
            for (const subsection of section.subsections || []) {
                for (const item of subsection.content || []) {
                    totalLessons++;
                }
            }
        }

        const completedCount = newCompletedSet.size;
        const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        console.log(`   Total: ${totalLessons}, Completed: ${completedCount}, Progress: ${completionPercentage}%`);

        try {
            const response = await fetch(`http://localhost:5000/api/enrollment/progress/${courseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    completionPercentage,
                    completedLessons: completedCount,
                }),
            });

            if (response.ok) {
                console.log(`✅ Synced ${completionPercentage}% to backend!`);
            } else {
                console.error(`❌ Sync failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Sync error:', error);
        }
    };

    // Sync existing localStorage progress to backend on mount
    useEffect(() => {
        if (course && courseId && completedLessons.size > 0) {
            // Sync existing progress from localStorage to backend
            syncProgressToBackend(completedLessons);
        }
    }, [course, courseId, completedLessons]); // Run when course loads AND when completedLessons changes

    // Mark non-video content as completed when viewed
    // Videos require 70% watch time (tracked separately below)
    useEffect(() => {
        if (lessonId && currentLesson && currentLesson.type !== 'video' && !completedLessons.has(lessonId)) {
            const newCompleted = new Set(completedLessons);
            newCompleted.add(lessonId);
            setCompletedLessons(newCompleted);
            // Save to localStorage
            localStorage.setItem(`course-${courseId}-completed`, JSON.stringify(Array.from(newCompleted)));
            // Sync to backend
            syncProgressToBackend(newCompleted);
        }
    }, [lessonId, courseId, currentLesson, completedLessons]);

    // Mark video as completed when 70% watched
    useEffect(() => {
        if (!lessonId || !currentLesson || currentLesson.type !== 'video') return;
        if (completedLessons.has(lessonId)) return; // Already completed

        // For YouTube videos, use youtube watch time
        const isYouTube = currentLesson.videoUrl?.includes('youtube.com') || currentLesson.videoUrl?.includes('youtu.be');

        if (isYouTube) {
            if (!youtubeDuration || youtubeDuration === 0) return;
            const watchPercentage = (youtubeWatchTime / youtubeDuration) * 100;

            if (watchPercentage >= 70) {
                const newCompleted = new Set(completedLessons);
                newCompleted.add(lessonId);
                setCompletedLessons(newCompleted);
                localStorage.setItem(`course-${courseId}-completed`, JSON.stringify(Array.from(newCompleted)));
                syncProgressToBackend(newCompleted); // Sync to backend
            }
        } else {
            // For local videos, use video element time
            if (!duration || duration === 0) return;
            const watchPercentage = (currentTime / duration) * 100;

            if (watchPercentage >= 70) {
                const newCompleted = new Set(completedLessons);
                newCompleted.add(lessonId);
                setCompletedLessons(newCompleted);
                localStorage.setItem(`course-${courseId}-completed`, JSON.stringify(Array.from(newCompleted)));
                syncProgressToBackend(newCompleted); // Sync to backend
            }
        }
    }, [currentTime, duration, youtubeWatchTime, youtubeDuration, lessonId, courseId, currentLesson, completedLessons]);

    // YouTube iframe message listener for tracking progress
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Only accept messages from YouTube
            if (event.origin !== 'https://www.youtube.com') return;

            try {
                const data = JSON.parse(event.data);

                if (data.event === 'infoDelivery' && data.info) {
                    // Update current time and duration from YouTube player
                    if (data.info.currentTime !== undefined) {
                        setYoutubeWatchTime(data.info.currentTime);
                    }
                    if (data.info.duration !== undefined) {
                        setYoutubeDuration(data.info.duration);
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Request periodic updates from YouTube player
    useEffect(() => {
        const iframe = document.querySelector('iframe[src*="youtube.com"]') as HTMLIFrameElement;
        if (!iframe) return;

        const interval = setInterval(() => {
            iframe.contentWindow?.postMessage(JSON.stringify({
                event: 'listening',
                id: iframe.id,
                channel: 'widget'
            }), '*');
        }, 1000); // Check every second

        return () => clearInterval(interval);
    }, [currentLesson]);

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleMuteToggle = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleFullscreen = () => {
        if (videoRef.current) {
            videoRef.current.requestFullscreen();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleSubsection = (subsectionId: string) => {
        setExpandedSubsections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(subsectionId)) {
                newSet.delete(subsectionId);
            } else {
                newSet.add(subsectionId);
            }
            return newSet;
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Video Player */}
                    <div className="lg:col-span-2">
                        <Card className="p-0 overflow-hidden">
                            {/* Render different content based on type */}
                            {currentLesson?.type === 'video' ? (
                                // VIDEO CONTENT
                                <div className="relative bg-black aspect-video">
                                    {currentLesson.videoUrl ? (
                                        currentLesson.videoUrl.includes('youtube.com') || currentLesson.videoUrl.includes('youtu.be') ? (
                                            // YouTube Video - uses native YouTube controls with tracking enabled
                                            <iframe
                                                className="w-full h-full"
                                                src={`${currentLesson.videoUrl.replace('watch?v=', 'embed/')}?enablejsapi=1`}
                                                title={currentLesson.title || 'Course Video'}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        ) : (
                                            // Local Video File with custom controls
                                            <>
                                                <video
                                                    ref={videoRef}
                                                    className="w-full h-full"
                                                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                                                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                                                    onPlay={() => setIsPlaying(true)}
                                                    onPause={() => setIsPlaying(false)}
                                                    poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
                                                >
                                                    <source src={currentLesson.videoUrl} type="video/mp4" />
                                                    Your browser does not support the video tag.
                                                </video>

                                                {/* Custom Controls for Local Video */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                                                    {/* Progress Bar */}
                                                    <div className="mb-3">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max={duration || 0}
                                                            value={currentTime}
                                                            onChange={(e) => {
                                                                if (videoRef.current) {
                                                                    videoRef.current.currentTime = Number(e.target.value);
                                                                }
                                                            }}
                                                            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:cursor-pointer"
                                                        />
                                                    </div>

                                                    {/* Control Buttons */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={handlePlayPause}
                                                                className="text-white hover:text-primary-400 transition-colors"
                                                                aria-label={isPlaying ? 'Pause' : 'Play'}
                                                            >
                                                                {isPlaying ? (
                                                                    <Pause className="w-6 h-6" />
                                                                ) : (
                                                                    <Play className="w-6 h-6" />
                                                                )}
                                                            </button>

                                                            <button
                                                                onClick={handleMuteToggle}
                                                                className="text-white hover:text-primary-400 transition-colors"
                                                                aria-label={isMuted ? 'Unmute' : 'Mute'}
                                                            >
                                                                {isMuted ? (
                                                                    <VolumeX className="w-5 h-5" />
                                                                ) : (
                                                                    <Volume2 className="w-5 h-5" />
                                                                )}
                                                            </button>

                                                            <span className="text-white text-sm">
                                                                {formatTime(currentTime)} / {formatTime(duration)}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={handleFullscreen}
                                                                className="text-white hover:text-primary-400 transition-colors"
                                                                aria-label="Fullscreen"
                                                            >
                                                                <Maximize className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    ) : (
                                        // Fallback: Demo Video with custom controls
                                        <>
                                            <video
                                                ref={videoRef}
                                                className="w-full h-full"
                                                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                                                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                                                onPlay={() => setIsPlaying(true)}
                                                onPause={() => setIsPlaying(false)}
                                                poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
                                            >
                                                <source src="http://localhost:5000/videos/demo-countdown.mp4" type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>

                                            {/* Custom Controls for Demo Video */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                                                {/* Progress Bar */}
                                                <div className="mb-3">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max={duration || 0}
                                                        value={currentTime}
                                                        onChange={(e) => {
                                                            if (videoRef.current) {
                                                                videoRef.current.currentTime = Number(e.target.value);
                                                            }
                                                        }}
                                                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:cursor-pointer"
                                                    />
                                                </div>

                                                {/* Control Buttons */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={handlePlayPause}
                                                            className="text-white hover:text-primary-400 transition-colors"
                                                            aria-label={isPlaying ? 'Pause' : 'Play'}
                                                        >
                                                            {isPlaying ? (
                                                                <Pause className="w-6 h-6" />
                                                            ) : (
                                                                <Play className="w-6 h-6" />
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={handleMuteToggle}
                                                            className="text-white hover:text-primary-400 transition-colors"
                                                            aria-label={isMuted ? 'Unmute' : 'Mute'}
                                                        >
                                                            {isMuted ? (
                                                                <VolumeX className="w-5 h-5" />
                                                            ) : (
                                                                <Volume2 className="w-5 h-5" />
                                                            )}
                                                        </button>

                                                        <span className="text-white text-sm">
                                                            {formatTime(currentTime)} / {formatTime(duration)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={handleFullscreen}
                                                            className="text-white hover:text-primary-400 transition-colors"
                                                            aria-label="Fullscreen"
                                                        >
                                                            <Maximize className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : currentLesson?.type === 'article' ? (
                                // ARTICLE CONTENT
                                <div className="p-8 bg-white dark:bg-gray-900 min-h-[400px]">
                                    <div className="flex items-center gap-3 mb-6">
                                        <FileText className="w-8 h-8 text-primary-600" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {currentLesson.title}
                                        </h2>
                                    </div>
                                    <div className="prose prose-lg dark:prose-invert max-w-none">
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {currentLesson.articleContent || currentLesson.description}
                                        </p>
                                    </div>
                                </div>
                            ) : currentLesson?.type === 'assignment' ? (
                                // ASSIGNMENT CONTENT
                                <div className="p-8 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950 min-h-[400px] flex items-center justify-center">
                                    <div className="text-center">
                                        <FileText className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                            {currentLesson.title}
                                        </h2>
                                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                                            {currentLesson.description}
                                        </p>
                                        <Badge variant="success">Assignment - {currentLesson.duration}</Badge>
                                    </div>
                                </div>
                            ) : (
                                // FALLBACK - No lesson selected or unknown type
                                <div className="p-8 bg-gray-100 dark:bg-gray-800 min-h-[400px] flex items-center justify-center">
                                    <div className="text-center">
                                        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {currentLesson ? `Content type "${currentLesson.type}" not supported` : 'Select a lesson to get started'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Video Info */}
                        {loading ? (
                            <Card className="p-6 mt-6">
                                <div className="animate-pulse">
                                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                                </div>
                            </Card>
                        ) : course ? (
                            <Card className="p-6 mt-6">
                                <h1 className="text-2xl font-bold mb-2">
                                    {course.title}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {course.description}
                                </p>
                                <div className="flex gap-3">
                                    <Badge variant="primary">{course.level || 'Beginner Friendly'}</Badge>
                                    <Badge variant="secondary">{course.duration || '24 Hours Content'}</Badge>
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-6 mt-6">
                                <p className="text-gray-600 dark:text-gray-400">Course not found</p>
                            </Card>
                        )}
                    </div>

                    {/* Chapters Sidebar */}
                    <div>
                        <Card className="p-6">
                            <h2 className="text-xl font-bold mb-4">Course Content</h2>
                            {loading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="animate-pulse">
                                            <div className="h-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : course && course.sections && course.sections.length > 0 ? (
                                <div className="space-y-2">
                                    {course.sections.map((section: any, sectionIndex: number) => (
                                        <div key={section._id || sectionIndex}>
                                            <h3 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">
                                                {section.title}
                                            </h3>
                                            {section.subsections && section.subsections.map((subsection: any, subIndex: number) => (
                                                <React.Fragment key={subsection._id || subIndex}>
                                                    <motion.button
                                                        onClick={() => toggleSubsection(subsection._id || `${sectionIndex}-${subIndex}`)}
                                                        whileHover={{ x: 4 }}
                                                        className={`w-full text-left p-3 rounded-lg transition-colors mb-1 ${subsection._id === lessonId
                                                            ? 'bg-primary-100 dark:bg-primary-950 border-2 border-primary-600'
                                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-shrink-0 mt-1">
                                                                {(() => {
                                                                    // Check if all lessons in subsection are completed
                                                                    const allCompleted = subsection.content?.every((item: any) =>
                                                                        completedLessons.has(item._id)
                                                                    );
                                                                    const completedCount = subsection.content?.filter((item: any) =>
                                                                        completedLessons.has(item._id)
                                                                    ).length || 0;

                                                                    return allCompleted && subsection.content?.length > 0 ? (
                                                                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                                    ) : completedCount > 0 ? (
                                                                        <div className="relative">
                                                                            <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-sm mb-1 line-clamp-2">
                                                                    {sectionIndex + 1}.{subIndex + 1} {subsection.title}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {(() => {
                                                                        const completedCount = subsection.content?.filter((item: any) =>
                                                                            completedLessons.has(item._id)
                                                                        ).length || 0;
                                                                        const totalCount = subsection.content?.length || 0;
                                                                        return `${completedCount}/${totalCount} completed`;
                                                                    })()}
                                                                </p>
                                                            </div>
                                                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                        </div>
                                                    </motion.button>

                                                    {/* Expanded Content Items */}
                                                    {expandedSubsections.has(subsection._id || `${sectionIndex}-${subIndex}`) && subsection.content && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="ml-8 space-y-1 mb-2"
                                                        >
                                                            {subsection.content.map((item: any, itemIndex: number) => {
                                                                const isCompleted = completedLessons.has(item._id);
                                                                const isCurrent = item._id === lessonId;

                                                                return (
                                                                    <div
                                                                        key={item._id || itemIndex}
                                                                        onClick={() => {
                                                                            if (item._id) {
                                                                                navigate(`/video/${courseId}/${item._id}`);
                                                                            }
                                                                        }}
                                                                        className={`p-2 rounded cursor-pointer text-sm transition-all ${isCurrent
                                                                            ? 'bg-primary-100 dark:bg-primary-900/40 border-l-2 border-primary-600'
                                                                            : isCompleted
                                                                                ? 'bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50'
                                                                                : 'hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-l-2 hover:border-primary-300'
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            {/* Completion indicator */}
                                                                            {isCompleted ? (
                                                                                <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isCurrent ? 'text-primary-600' : 'text-green-600 dark:text-green-400'}`} />
                                                                            ) : (
                                                                                <Circle className={`w-4 h-4 flex-shrink-0 ${isCurrent ? 'text-primary-600' : 'text-gray-300 dark:text-gray-600'}`} />
                                                                            )}

                                                                            <span className="text-xs text-gray-400">{sectionIndex + 1}.{subIndex + 1}.{itemIndex + 1}</span>
                                                                            <span className={`flex-1 ${isCurrent
                                                                                ? 'font-semibold text-primary-700 dark:text-primary-400'
                                                                                : isCompleted
                                                                                    ? 'text-gray-600 dark:text-gray-400'
                                                                                    : 'text-gray-700 dark:text-gray-300'
                                                                                }`}>
                                                                                {item.title}
                                                                            </span>
                                                                            {item.type && (
                                                                                <Badge variant="secondary" className="text-xs">
                                                                                    {item.type}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </motion.div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    No content available for this course yet.
                                </p>
                            )}

                            {/* Progress */}
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-semibold">Your Progress</span>
                                    <span className="text-sm text-gray-500">
                                        {(() => {
                                            if (!course?.sections) return '0%';

                                            // Calculate total lessons and completed count
                                            let totalLessons = 0;
                                            let completedCount = 0;

                                            for (const section of course.sections) {
                                                for (const subsection of section.subsections || []) {
                                                    for (const item of subsection.content || []) {
                                                        totalLessons++;
                                                        if (completedLessons.has(item._id)) {
                                                            completedCount++;
                                                        }
                                                    }
                                                }
                                            }

                                            if (totalLessons === 0) return '0%';
                                            const percentage = Math.round((completedCount / totalLessons) * 100);
                                            return `${percentage}%`;
                                        })()}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                        style={{
                                            width: (() => {
                                                if (!course?.sections) return '0%';

                                                // Calculate total lessons and completed count
                                                let totalLessons = 0;
                                                let completedCount = 0;

                                                for (const section of course.sections) {
                                                    for (const subsection of section.subsections || []) {
                                                        for (const item of subsection.content || []) {
                                                            totalLessons++;
                                                            if (completedLessons.has(item._id)) {
                                                                completedCount++;
                                                            }
                                                        }
                                                    }
                                                }

                                                if (totalLessons === 0) return '0%';
                                                const percentage = Math.round((completedCount / totalLessons) * 100);
                                                return `${percentage}%`;
                                            })()
                                        }}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default VideoPlayer;
