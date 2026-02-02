import { useEffect } from 'react';

interface UseContentProtectionOptions {
    onRightClick?: () => void;
    onKeyboardShortcut?: (key: string) => void;
    disableRightClick?: boolean;
    disableKeyboardShortcuts?: boolean;
    blurOnTabLoss?: boolean;
}

export const useContentProtection = (options: UseContentProtectionOptions = {}) => {
    const {
        onRightClick,
        onKeyboardShortcut,
        disableRightClick = true,
        disableKeyboardShortcuts = true,
        blurOnTabLoss = true,
    } = options;

    useEffect(() => {
        // Prevent right-click context menu
        const handleContextMenu = (e: MouseEvent) => {
            if (disableRightClick) {
                e.preventDefault();
                onRightClick?.();
            }
        };

        // Prevent keyboard shortcuts for save/print
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!disableKeyboardShortcuts) return;

            // Ctrl+S (Save)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                onKeyboardShortcut?.('save');
            }

            // Ctrl+P (Print)
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                onKeyboardShortcut?.('print');
            }

            // Ctrl+Shift+S (Save As)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                onKeyboardShortcut?.('save-as');
            }

            // F12 (Developer Tools)
            if (e.key === 'F12') {
                e.preventDefault();
                onKeyboardShortcut?.('devtools');
            }

            // Ctrl+Shift+I (Developer Tools)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                onKeyboardShortcut?.('devtools');
            }

            // Ctrl+U (View Source)
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                onKeyboardShortcut?.('view-source');
            }
        };

        // Blur content when tab is not active (prevents screenshots)
        const handleVisibilityChange = () => {
            if (blurOnTabLoss) {
                const contentElements = document.querySelectorAll('.protected-content');
                contentElements.forEach((element) => {
                    if (document.hidden) {
                        (element as HTMLElement).style.filter = 'blur(10px)';
                    } else {
                        (element as HTMLElement).style.filter = 'none';
                    }
                });
            }
        };

        // Add event listeners
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [disableRightClick, disableKeyboardShortcuts, blurOnTabLoss, onRightClick, onKeyboardShortcut]);
};
