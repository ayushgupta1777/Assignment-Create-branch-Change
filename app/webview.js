// app/webview.js - With Contact Picker Bridge
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
  BackHandler,
  StatusBar,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import Contacts from 'react-native-contacts';

const APP_URL = 'https://czone-credit.web.app';

export default function WebViewScreen() {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (canGoBack && webViewRef.current) {
            webViewRef.current.goBack();
            return true;
          }
          return false;
        }
      );
      return () => backHandler.remove();
    }
  }, [canGoBack]);

  // Request contacts permission (Android)
  const requestContactsPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'This app needs access to your contacts to add customers.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('[Native] Permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  };

  // Open contact picker
  const openContactPicker = async () => {
    try {
      // Request permission first
      const hasPermission = await requestContactsPermission();
      
      if (!hasPermission) {
        // Send permission denied message back to WebView
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'contact-picker-result',
          success: false,
          error: 'Permission denied',
          message: 'Please grant contacts permission in app settings.'
        }));
        return;
      }

      // Open contact picker
      Contacts.openContactPicker((err, contact) => {
        if (err) {
          console.error('[Native] Contact picker error:', err);
          webViewRef.current?.postMessage(JSON.stringify({
            type: 'contact-picker-result',
            success: false,
            error: err.message || 'Failed to pick contact',
            message: 'Could not access contacts. Please try adding manually.'
          }));
          return;
        }

        // Extract contact information
        const firstName = contact.givenName || '';
        const lastName = contact.familyName || '';
        const fullName = `${firstName} ${lastName}`.trim() || contact.displayName || 'Unknown';
        
        // Get phone number
        const phoneNumber = contact.phoneNumbers && contact.phoneNumbers.length > 0
          ? contact.phoneNumbers[0].number.replace(/[^0-9+]/g, '')
          : '';

        console.log('[Native] ✅ Contact selected:', fullName, phoneNumber);

        // Send contact data back to WebView
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'contact-picker-result',
          success: true,
          contact: {
            name: fullName,
            firstName: firstName,
            lastName: lastName,
            phone: phoneNumber
          }
        }));
      });
    } catch (error) {
      console.error('[Native] ❌ Contact picker failed:', error);
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'contact-picker-result',
        success: false,
        error: error.message,
        message: 'Could not access contacts. Please try adding manually.'
      }));
    }
  };

  // FIXED: Run only once per page load
  const injectedJavaScript = `
    (function() {
      // Prevent multiple executions
      if (window.__mobileWrapperInitialized) {
        return true;
      }
      window.__mobileWrapperInitialized = true;
      
      console.log('[Mobile] Initializing...');
      
      // Mobile viewport - FIXED for better input handling
      function setupViewport() {
        let meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'viewport';
          document.head.appendChild(meta);
        }
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
      }

      // Mobile CSS - FIXED for input fields
      function injectStyles() {
        if (document.getElementById('mobile-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'mobile-styles';
        style.textContent = \`
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            overflow-x: hidden !important;
            -webkit-user-select: text !important;
            user-select: text !important;
          }
          input, select, textarea, button {
            font-size: 16px !important;
            -webkit-user-select: text !important;
            user-select: text !important;
            pointer-events: auto !important;
            touch-action: manipulation !important;
            -webkit-tap-highlight-color: rgba(0,0,0,0.1) !important;
          }
          input:focus, textarea:focus, select:focus {
            outline: 2px solid #007AFF !important;
          }
          * {
            -webkit-tap-highlight-color: rgba(0,0,0,0.1) !important;
          }
        \`;
        document.head.appendChild(style);
      }

      // ========== CONTACT PICKER BRIDGE ==========
      // Override navigator.contacts for WebView
      if (!window.navigator.contacts) {
        window.navigator.contacts = {};
      }
      
      window.navigator.contacts.select = async function(properties, options) {
        return new Promise((resolve, reject) => {
          console.log('[Mobile] 📞 Contact picker requested');
          
          // Store promise callbacks globally
          window.__contactPickerResolve = resolve;
          window.__contactPickerReject = reject;
          
          // Request contact picker from native
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'open-contact-picker'
            }));
          } catch (e) {
            console.error('[Mobile] Failed to request contact picker:', e);
            reject(new Error('Contact picker not available'));
          }
        });
      };
      // ==========================================

      // Intercept fetch API
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'api-call',
            url: url.toString(),
            method: options?.method || 'GET',
            hasAuth: !!(options?.headers?.Authorization || options?.headers?.authorization)
          }));
        } catch (e) {}
        
        return originalFetch.apply(this, args)
          .then(response => {
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'api-response',
                url: url.toString(),
                status: response.status,
                ok: response.ok
              }));
            } catch (e) {}
            return response;
          })
          .catch(error => {
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'api-error',
                url: url.toString(),
                error: error.message
              }));
            } catch (e) {}
            throw error;
          });
      };

      // Monitor localStorage
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        
        if (key === 'token') {
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'token-saved',
              hasToken: true,
              tokenLength: value ? value.length : 0
            }));
          } catch (e) {}
        }
      };

      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = function(key) {
        originalRemoveItem.apply(this, arguments);
        
        if (key === 'token') {
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'token-removed',
              hasToken: false
            }));
          } catch (e) {}
        }
      };

      // Send auth status once
      function sendAuthStatus() {
        try {
          const token = localStorage.getItem('token');
          const path = window.location.pathname;
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'auth-status',
            hasToken: !!token,
            path: path,
            tokenLength: token ? token.length : 0
          }));
        } catch (e) {
          console.error('[Mobile] Auth check error:', e);
        }
      }

      // Initialize
      setupViewport();
      injectStyles();
      
      // Send auth status after page loads
      if (document.readyState === 'complete') {
        setTimeout(sendAuthStatus, 500);
      } else {
        window.addEventListener('load', () => {
          setTimeout(sendAuthStatus, 500);
        });
      }

      console.log('[Mobile] Initialized ✓');
      console.log('[Mobile] 📞 Contact picker bridge ready');
    })();
    true;
  `;

  // Handle messages from WebView
  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch(data.type) {
        case 'open-contact-picker':
          console.log('[Native] 📞 Opening contact picker...');
          openContactPicker();
          break;

        case 'api-call':
          console.log('[Native] 🔵 API Call:', data.method, data.url);
          console.log('[Native]    Auth:', data.hasAuth ? '✓ Present' : '✗ Missing');
          break;
          
        case 'api-response':
          const emoji = data.ok ? '🟢' : '🔴';
          console.log(`[Native] ${emoji} Response:`, data.status, data.url);
          break;
          
        case 'api-error':
          console.error('[Native] ❌ API Error:', data.error);
          console.error('[Native]    URL:', data.url);
          break;
        
        case 'token-saved':
          console.log('[Native] ✅ TOKEN SAVED! Length:', data.tokenLength);
          console.log('[Native] 🎉 User logged in successfully');
          break;
          
        case 'token-removed':
          console.log('[Native] 🚪 Token removed - User logged out');
          break;
          
        case 'auth-status':
          const status = data.hasToken ? '✅ YES' : '❌ NO';
          console.log('[Native] 📊 Has Token:', status);
          console.log('[Native]    Path:', data.path);
          if (data.hasToken) {
            console.log('[Native]    Token Length:', data.tokenLength);
          }
          
          // Only alert if on home without token after delay
          if (data.path.includes('/home') && !data.hasToken) {
            setTimeout(() => {
              Alert.alert(
                'Session Expired',
                'Please login again',
                [{ 
                  text: 'OK', 
                  onPress: () => {
                    webViewRef.current?.injectJavaScript(`
                      window.location.href = '/login';
                      true;
                    `);
                  }
                }]
              );
            }, 2000);
          }
          break;
          
        default:
          console.log('[Native] 📨 Message:', data.type);
      }
    } catch (err) {
      // Ignore parse errors
    }
  };

  // Handle messages FROM native TO WebView (postMessage)
  useEffect(() => {
    // This is handled by the webViewRef.current?.postMessage() calls above
  }, []);

  const onError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[Native] ❌ WebView Error:', nativeEvent);
    
    Alert.alert(
      'Connection Error',
      'Failed to load the app. Check your internet connection.',
      [
        { text: 'Retry', onPress: () => webViewRef.current?.reload() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const onNavigationStateChange = (navState) => {
    console.log('[Native] 📍 Navigation:', navState.url);
    setCanGoBack(navState.canGoBack);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <WebView
        ref={webViewRef}
        source={{ uri: APP_URL }}
        
        // JavaScript
        javaScriptEnabled={true}
        injectedJavaScript={injectedJavaScript}
        onMessage={onMessage}
        
        // Storage
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={true}
        
        // Performance
        androidHardwareAccelerationDisabled={false}
        
        // Mobile
        scalesPageToFit={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        // Enable text input
        keyboardDisplayRequiresUserAction={false}
        
        // Media
        allowsInlineMediaPlayback={true}
        
        // Security
        originWhitelist={['https://*', 'http://*']}
        
        // Events
        onLoadStart={() => {
          console.log('[Native] ⏳ Loading started...');
          setLoading(true);
        }}
        onLoadEnd={() => {
          console.log('[Native] ✅ Loading complete');
          setLoading(false);
        }}
        onNavigationStateChange={onNavigationStateChange}
        onError={onError}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[Native] ⚠️ HTTP Error:', nativeEvent.statusCode);
        }}
        
        style={styles.webview}
      />

      {/* {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )} */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});