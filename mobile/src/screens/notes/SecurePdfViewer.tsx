import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { noteService } from '../../services/noteService';
import { API_BASE_URL } from '../../config/api.config';

function buildPdfViewerHtml(streamUrl: string, title: string): string {
  const safeTitle = title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
  <title>${safeTitle}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background-color: #1F2937; width: 100%; min-height: 100%; user-select: none; -webkit-user-select: none; }
    #pdf-container { display: flex; flex-direction: column; align-items: center; padding: 12px 0; gap: 14px; width: 100%; }
    canvas { box-shadow: 0 4px 16px rgba(0,0,0,0.4); background: white; max-width: 98%; height: auto !important; border-radius: 4px; }
    #loading-box { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; gap: 12px; }
    .spinner { width: 36px; height: 36px; border: 4px solid rgba(255,255,255,0.2); border-top-color: #6366F1; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    #error-box { display: none; color: #FCA5A5; font-family: sans-serif; text-align: center; padding: 30px; font-size: 14px; line-height: 1.5; }
  </style>
</head>
<body>
  <div id="loading-box">
    <div class="spinner"></div>
    <div style="font-size: 15px; font-weight: 600;">Rendering Document…</div>
  </div>
  <div id="error-box"></div>
  <div id="pdf-container"></div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    var url = '${streamUrl}';
    
    pdfjsLib.getDocument({ url: url, withCredentials: false }).promise.then(function(pdf) {
      document.getElementById('loading-box').style.display = 'none';
      var container = document.getElementById('pdf-container');
      
      for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        (function(num) {
          pdf.getPage(num).then(function(page) {
            var scale = window.devicePixelRatio && window.devicePixelRatio > 1 ? 1.6 : 1.3;
            var viewport = page.getViewport({ scale: scale });
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            container.appendChild(canvas);
            
            var renderContext = { canvasContext: context, viewport: viewport };
            page.render(renderContext);
          });
        })(pageNum);
      }
    }).catch(function(err) {
      console.error('PDF.js error:', err);
      document.getElementById('loading-box').style.display = 'none';
      var errBox = document.getElementById('error-box');
      errBox.style.display = 'block';
      errBox.innerHTML = '⚠️ Failed to render PDF document.<br/><br/>' + (err.message || 'Error loading document content.');
    });

    document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
    document.addEventListener('selectstart', function(e) { e.preventDefault(); });
  </script>
</body>
</html>`;
}

interface SecurePdfViewerProps {
  visible: boolean;
  noteId: string;
  noteTitle: string;
  fileType: string;
  onClose: () => void;
}

type ViewerState =
  | { status: 'loading' }
  | { status: 'ready'; streamUrl: string; viewToken: string; noteId: string }
  | { status: 'error'; message: string }
  | { status: 'expired' };

export const SecurePdfViewer: React.FC<SecurePdfViewerProps> = ({
  visible,
  noteId,
  noteTitle,
  fileType,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [viewerState, setViewerState] = useState<ViewerState>({ status: 'loading' });
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const tokenRefreshTimer = useRef<NodeJS.Timeout | null>(null);

  const hasRetriedRef = useRef(false);

  // ── Fetch a signed view token and build the stream URL ──────────────────────
  const fetchViewToken = useCallback(async (id: string) => {
    try {
      setViewerState({ status: 'loading' });
      setWebViewLoading(true);

      console.log(`[PDF VIEWER REQUEST] Fetching view token for noteId=${id}`);
      const res = await noteService.getViewToken(id);

      if (!res?.viewToken) {
        throw new Error('Server returned empty view token.');
      }

      const streamUrl = noteService.buildStreamUrl(id, res.viewToken);
      console.log(`[PDF VIEWER SUCCESS] Stream URL: ${streamUrl}`);

      setViewerState({
        status: 'ready',
        streamUrl,
        viewToken: res.viewToken,
        noteId: id,
      });

      hasRetriedRef.current = false;

      // Schedule token refresh at 80% of TTL (e.g., 4 min if TTL=5 min)
      const refreshAt = (res.expiresIn * 0.8) * 1000;
      if (tokenRefreshTimer.current) clearTimeout(tokenRefreshTimer.current);
      tokenRefreshTimer.current = setTimeout(() => {
        console.log('[PDF VIEWER] Token nearing expiry — refreshing…');
        fetchViewToken(id);
      }, refreshAt);
    } catch (err: any) {
      console.error('[PDF VIEWER ERROR]', err?.response?.status, err?.response?.data || err.message);

      // Auto retry 1 time on transient network error
      if (!hasRetriedRef.current && (!err?.response || err?.response?.status >= 500)) {
        console.log('[PDF VIEWER] Retrying token fetch 1 time...');
        hasRetriedRef.current = true;
        setTimeout(() => fetchViewToken(id), 1000);
        return;
      }

      const status = err?.response?.status;
      const backendMessage = err?.response?.data?.message || err?.userMessage || err?.message;

      if (status === 401) {
        setViewerState({ status: 'expired' });
      } else if (status === 403) {
        setViewerState({
          status: 'error',
          message: backendMessage || 'You are not enrolled in this course.',
        });
      } else if (status === 404) {
        setViewerState({
          status: 'error',
          message: backendMessage || 'Note file missing on server.',
        });
      } else if (status === 500) {
        setViewerState({
          status: 'error',
          message: 'Server error while loading note. Please try again later.',
        });
      } else {
        setViewerState({
          status: 'error',
          message: backendMessage || 'Failed to load note document.',
        });
      }
    }
  }, []);

  useEffect(() => {
    if (visible && noteId) {
      fetchViewToken(noteId);
    }
    return () => {
      if (tokenRefreshTimer.current) clearTimeout(tokenRefreshTimer.current);
    };
  }, [visible, noteId, fetchViewToken]);

  // ── Print handler ────────────────────────────────────────────────────────────
  const handlePrint = useCallback(async () => {
    if (viewerState.status !== 'ready') return;
    setIsPrinting(true);

    // Fire-and-forget print log
    noteService.logPrint(noteId).catch(() => {});

    // Inject window.print() into the WebView — triggers system print dialog
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        (function() {
          try { window.print(); } catch(e) { console.log('Print error:', e); }
        })();
        true;
      `);
    }

    // Small delay to allow dialog to appear
    setTimeout(() => setIsPrinting(false), 2000);
  }, [viewerState, noteId]);

  // ── Close handler ─────────────────────────────────────────────────────────
  const handleClose = () => {
    if (tokenRefreshTimer.current) clearTimeout(tokenRefreshTimer.current);
    setViewerState({ status: 'loading' });
    onClose();
  };

  // ── WebView navigation handler — block any file:// or download:// URLs ────
  const handleNavigationChange = (event: WebViewNavigation): boolean => {
    const url = event.url;
    // Block any navigation that would save or open external apps
    if (
      url.startsWith('blob:') ||
      url.startsWith('file:') ||
      url.startsWith('content:') ||
      url.includes('download=') ||
      url.includes('Content-Disposition: attachment')
    ) {
      console.warn('[PDF VIEWER] Blocked navigation to:', url);
      return false; // Prevent navigation
    }
    return true;
  };

  // ── File type badge ────────────────────────────────────────────────────────
  const FILE_COLORS: Record<string, string> = {
    pdf: '#EF4444',
    txt: '#6366F1',
    doc: '#2563EB',
    html: '#059669',
    file: '#4F46E5',
  };
  const fileColor = FILE_COLORS[fileType] || FILE_COLORS.file;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      statusBarTranslucent={false}
    >
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 0 : 0 }]}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <LinearGradient colors={['#4F46E5', '#6366F1']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={[styles.typeBadge, { backgroundColor: fileColor }]}>
              <Text style={styles.typeBadgeText}>{fileType.toUpperCase()}</Text>
            </View>
            <Text style={styles.headerTitle} numberOfLines={2}>{noteTitle}</Text>
            <Text style={styles.headerSub}>🔒 Secure Viewer • View Only</Text>
          </View>

          <TouchableOpacity
            style={[styles.printBtn, viewerState.status !== 'ready' && styles.printBtnDisabled]}
            onPress={handlePrint}
            disabled={viewerState.status !== 'ready' || isPrinting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isPrinting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.printBtnText}>🖨</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Content Area ───────────────────────────────────────────────── */}
        <View style={styles.content}>

          {/* Loading State */}
          {viewerState.status === 'loading' && (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Preparing secure viewer…</Text>
              <Text style={styles.loadingSubText}>Verifying your enrollment access</Text>
            </View>
          )}

          {/* Error State */}
          {viewerState.status === 'error' && (
            <View style={styles.centerBox}>
              <Text style={styles.errorIcon}>🔒</Text>
              <Text style={styles.errorTitle}>Access Denied</Text>
              <Text style={styles.errorMessage}>{viewerState.message}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => fetchViewToken(noteId)}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeTextBtn} onPress={handleClose}>
                <Text style={styles.closeTextBtnText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Expired State */}
          {viewerState.status === 'expired' && (
            <View style={styles.centerBox}>
              <Text style={styles.errorIcon}>⏱</Text>
              <Text style={styles.errorTitle}>Session Expired</Text>
              <Text style={styles.errorMessage}>Your viewing session has expired. Tap below to start a fresh session.</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => fetchViewToken(noteId)}>
                <Text style={styles.retryText}>Refresh Session</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Ready — WebView ─────────────────────────────────────────────── */}
          {viewerState.status === 'ready' && (
            <>
              {webViewLoading && (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={styles.loadingText}>Loading document…</Text>
                </View>
              )}
              <WebView
                ref={webViewRef}
                source={
                  fileType === 'pdf'
                    ? { html: buildPdfViewerHtml(viewerState.streamUrl, noteTitle), baseUrl: API_BASE_URL }
                    : { uri: viewerState.streamUrl }
                }
                style={[styles.webView, webViewLoading && styles.hidden]}
                onLoadStart={() => setWebViewLoading(true)}
                onLoadEnd={() => setWebViewLoading(false)}
                onError={(e) => {
                  console.error('[PDF VIEWER WEBVIEW ERROR]', e.nativeEvent);
                  const statusCode = (e.nativeEvent as any).statusCode;
                  if (statusCode === 401) {
                    setViewerState({ status: 'expired' });
                  } else if (statusCode === 403) {
                    setViewerState({
                      status: 'error',
                      message: "You don't have permission to view this note.",
                    });
                  } else {
                    setViewerState({
                      status: 'error',
                      message: 'Failed to load document. Please check your internet connection and try again.',
                    });
                  }
                }}
                onHttpError={(e) => {
                  const statusCode = e.nativeEvent.statusCode;
                  if (statusCode === 401) setViewerState({ status: 'expired' });
                  else if (statusCode === 403) {
                    setViewerState({
                      status: 'error',
                      message: "You don't have permission to view this note.",
                    });
                  }
                }}
                onShouldStartLoadWithRequest={handleNavigationChange}
                allowsInlineMediaPlayback={false}
                mediaPlaybackRequiresUserAction={true}
                allowsBackForwardNavigationGestures={false}
                allowsLinkPreview={false}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                cacheEnabled={false}
                incognito={true}
                injectedJavaScript={`
                  (function() {
                    document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
                    document.addEventListener('selectstart', function(e) { e.preventDefault(); });
                    if (document.body) {
                      document.body.style.userSelect = 'none';
                      document.body.style.webkitUserSelect = 'none';
                    }
                  })();
                  true;
                `}
              />
            </>
          )}
        </View>

        {/* ── Footer security banner ──────────────────────────────────────── */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 4 }]}>
          <Text style={styles.footerText}>
            🔐 This content is protected. Printing is allowed for personal study only.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    fontWeight: '500',
  },
  printBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printBtnDisabled: {
    opacity: 0.4,
  },
  printBtnText: {
    fontSize: 18,
  },
  // ── Content ────────────────────────────────────────────────────────────────
  content: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  hidden: {
    opacity: 0,
    height: 0,
  },
  webViewLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    zIndex: 10,
    gap: 12,
  },
  // ── States ─────────────────────────────────────────────────────────────────
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  loadingSubText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  closeTextBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeTextBtnText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FED7AA',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 16,
  },
});
