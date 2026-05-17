import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:webview_flutter_wkwebview/webview_flutter_wkwebview.dart';

import 'widgets/loading_widget.dart';

/// CHANGE THIS IP IF YOUR WIFI IP CHANGES
/// Run: ipconfig
/// Use your IPv4 address
const String _chatbotHost =
    String.fromEnvironment(
      'CHATBOT_URL',
      defaultValue: 'http://192.168.1.3:3000',
    );

const String _chatbotPath = '/';
const String _chatbotUrl = '$_chatbotHost$_chatbotPath';

class ChatbotScreen extends StatefulWidget {
  const ChatbotScreen({super.key});

  @override
  State<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends State<ChatbotScreen> {
  late final WebViewController _controller;

  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';
  int _progress = 0;

  @override
  void initState() {
    super.initState();

    final PlatformWebViewControllerCreationParams params;

    if (WebViewPlatform.instance is WebKitWebViewPlatform) {
      params = WebKitWebViewControllerCreationParams(
        allowsInlineMediaPlayback: true,
        mediaTypesRequiringUserAction: const <PlaybackMediaTypes>{},
      );
    } else {
      params = const PlatformWebViewControllerCreationParams();
    }

    _controller = WebViewController.fromPlatformCreationParams(params)
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            setState(() {
              _progress = progress;
            });
          },

          onPageStarted: (_) {
            setState(() {
              _isLoading = true;
              _hasError = false;
            });
          },

          onPageFinished: (_) {
            setState(() {
              _isLoading = false;
            });
          },

          onWebResourceError: _onWebResourceError,

          onNavigationRequest: _onNavigationRequest,
        ),
      )
      ..loadRequest(Uri.parse(_chatbotUrl));

    if (_controller.platform is AndroidWebViewController) {
      final androidController =
          _controller.platform as AndroidWebViewController;

      AndroidWebViewController.enableDebugging(true);

      androidController.setMediaPlaybackRequiresUserGesture(false);

      androidController.setGeolocationPermissionsPromptCallbacks(
        onShowPrompt: (request) async =>
            const GeolocationPermissionsResponse(
          allow: true,
          retain: true,
        ),
      );
    }
  }

  Future<NavigationDecision> _onNavigationRequest(
    NavigationRequest request,
  ) async {
    final uri = Uri.parse(request.url);

    if (uri.scheme == 'mailto' ||
        uri.scheme == 'tel' ||
        uri.scheme == 'sms' ||
        uri.scheme == 'intent') {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }

      return NavigationDecision.prevent;
    }

    if (!['http', 'https'].contains(uri.scheme)) {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }

      return NavigationDecision.prevent;
    }

    return NavigationDecision.navigate;
  }

  void _onWebResourceError(WebResourceError error) {
    if (error.isForMainFrame != true) return;

    setState(() {
      _isLoading = false;
      _hasError = true;
      _errorMessage = error.description;
    });
  }

  Future<bool> _onWillPop() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return false;
    }

    return true;
  }

  void _reloadPage() {
    setState(() {
      _isLoading = true;
      _hasError = false;
      _errorMessage = '';
    });

    _controller.reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,

      body: SafeArea(
        child: WillPopScope(
          onWillPop: _onWillPop,

          child: Stack(
            children: [
              WebViewWidget(
                controller: _controller,
              ),

              if (_isLoading || _hasError)
                Positioned.fill(
                  child: Container(
                    color: Colors.black,

                    child: Center(
                      child: _hasError
                          ? _buildErrorState()
                          : LoadingWidget(
                              label: 'Loading MedTripz AI...',
                              progress: _progress,
                            ),
                    ),
                  ),
                ),

              const Positioned(
                top: 16,
                left: 16,
                right: 16,
                child: _AppHeader(
                  label: 'MedTripz AI Assistant',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),

      child: Column(
        mainAxisSize: MainAxisSize.min,

        children: [
          const Icon(
            Icons.wifi_off,
            color: Colors.white70,
            size: 80,
          ),

          const SizedBox(height: 20),

          const Text(
            'Connection Error',
            style: TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),

          const SizedBox(height: 12),

          Text(
            _errorMessage.isNotEmpty
                ? _errorMessage
                : 'Unable to connect to chatbot.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 16,
            ),
          ),

          const SizedBox(height: 28),

          ElevatedButton(
            onPressed: _reloadPage,

            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00D1B2),
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(
                horizontal: 36,
                vertical: 16,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(40),
              ),
            ),

            child: const Text(
              'Retry',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AppHeader extends StatelessWidget {
  const _AppHeader({
    required this.label,
  });

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 18,
        vertical: 14,
      ),

      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.7),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: Colors.white12,
        ),
        boxShadow: const [
          BoxShadow(
            color: Colors.black54,
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),

      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,

            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [
                  Color(0xFF00BFA6),
                  Color(0xFF1DE9B6),
                ],
              ),
            ),

            child: const Icon(
              Icons.health_and_safety,
              color: Colors.white,
              size: 28,
            ),
          ),

          const SizedBox(width: 14),

          Expanded(
            child: Text(
              label,

              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}