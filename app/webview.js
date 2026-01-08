// app/webview.js - With Fixed Permission Handling
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
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';

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

  // Request contacts permission (Android) - IMPROVED VERSION
  // const requestContactsPermission = async () => {
  //   if (Platform.OS !== 'android') {
  //     return true; // iOS handles permissions differently
  //   }

  //   try {
  //     // Check if permission is already granted
  //     const checkResult = await PermissionsAndroid.check(
  //       PermissionsAndroid.PERMISSIONS.READ_CONTACTS
  //     );

  //     if (checkResult) {
  //       console.log('[Native] ✅ Contacts permission already granted');
  //       return true;
  //     }

  //     // Request permission
  //     console.log('[Native] 📱 Requesting contacts permission...');
  //     const granted = await PermissionsAndroid.request(
  //       PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
  //       {
  //         title: 'Contacts Permission',
  //         message: 'This app needs access to your contacts to add customers.',
  //         buttonPositive: 'Allow',
  //         buttonNegative: 'Deny',
  //       }
  //     );

  //     if (granted === PermissionsAndroid.RESULTS.GRANTED) {
  //       console.log('[Native] ✅ Contacts permission granted');
  //       return true;
  //     } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
  //       console.log('[Native] ⚠️ Permission permanently denied');
        
  //       // Show alert to open settings
  //       Alert.alert(
  //         'Permission Required',
  //         'Contacts permission is required to select contacts. Please enable it in app settings.',
  //         [
  //           {
  //             text: 'Open Settings',
  //             onPress: () => {
  //               Linking.openSettings();
  //             }
  //           },
  //           {
  //             text: 'Cancel',
  //             style: 'cancel'
  //           }
  //         ]
  //       );
  //       return false;
  //     } else {
  //       console.log('[Native] ❌ Contacts permission denied');
  //       return false;
  //     }
  //   } catch (err) {
  //     console.error('[Native] Permission error:', err);
  //     Alert.alert(
  //       'Error',
  //       'Failed to request contacts permission. Please try again.'
  //     );
  //     return false;
  //   }
  // };

  // Request contacts permission (Expo version)
const requestContactsPermission = async () => {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    
    if (status === 'granted') {
      console.log('[Native] ✅ Contacts permission granted');
      return true;
    } else {
      console.log('[Native] ❌ Contacts permission denied');
      Alert.alert(
        'Permission Required',
        'Contacts permission is required. Please enable it in app settings.',
        [
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings()
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return false;
    }
  } catch (err) {
    console.error('[Native] Permission error:', err);
    return false;
  }
};

  // Open contact picker - IMPROVED VERSION
  // const openContactPicker = async () => {
  //   try {
  //     console.log('[Native] 📞 Opening contact picker...');
      
  //     // Request permission first
  //     const hasPermission = await requestContactsPermission();
      
  //     if (!hasPermission) {
  //       console.log('[Native] ❌ No permission, sending error to web');
  //       webViewRef.current?.postMessage(JSON.stringify({
  //         type: 'contact-picker-result',
  //         success: false,
  //         error: 'Permission denied',
  //         message: 'Please grant contacts permission in app settings to use this feature.'
  //       }));
  //       return;
  //     }

  //     console.log('[Native] ✅ Permission granted, opening picker...');

  //     // Open contact picker
  //     Contacts.openContactPicker((err, contact) => {
  //       if (err) {
  //         console.error('[Native] ❌ Contact picker error:', err);
          
  //         // Check if it's a permission error
  //         if (err.message && err.message.includes('permission')) {
  //           Alert.alert(
  //             'Permission Required',
  //             'Please enable contacts permission in your phone settings.',
  //             [
  //               {
  //                 text: 'Open Settings',
  //                 onPress: () => Linking.openSettings()
  //               },
  //               {
  //                 text: 'Cancel',
  //                 style: 'cancel'
  //               }
  //             ]
  //           );
  //         }
          
  //         webViewRef.current?.postMessage(JSON.stringify({
  //           type: 'contact-picker-result',
  //           success: false,
  //           error: err.message || 'Failed to pick contact',
  //           message: 'Could not access contacts. Please check app permissions.'
  //         }));
  //         return;
  //       }

  //       if (!contact) {
  //         console.log('[Native] ℹ️ No contact selected');
  //         webViewRef.current?.postMessage(JSON.stringify({
  //           type: 'contact-picker-result',
  //           success: false,
  //           error: 'No contact selected',
  //           message: 'No contact was selected.'
  //         }));
  //         return;
  //       }

  //       // Extract contact information
  //       const firstName = contact.givenName || '';
  //       const lastName = contact.familyName || '';
  //       const fullName = `${firstName} ${lastName}`.trim() || contact.displayName || 'Unknown';
        
  //       // Get phone number
  //       const phoneNumber = contact.phoneNumbers && contact.phoneNumbers.length > 0
  //         ? contact.phoneNumbers[0].number.replace(/[^0-9+]/g, '')
  //         : '';

  //       console.log('[Native] ✅ Contact selected:', fullName, phoneNumber);

  //       // Send contact data back to WebView
  //       webViewRef.current?.postMessage(JSON.stringify({
  //         type: 'contact-picker-result',
  //         success: true,
  //         contact: {
  //           name: fullName,
  //           firstName: firstName,
  //           lastName: lastName,
  //           phone: phoneNumber
  //         }
  //       }));
  //     });
  //   } catch (error) {
  //     console.error('[Native] ❌ Contact picker failed:', error);
      
  //     Alert.alert(
  //       'Error',
  //       'Failed to open contact picker. Please try again or add the contact manually.',
  //       [{ text: 'OK' }]
  //     );
      
  //     webViewRef.current?.postMessage(JSON.stringify({
  //       type: 'contact-picker-result',
  //       success: false,
  //       error: error.message,
  //       message: 'Could not access contacts. Please try adding manually.'
  //     }));
  //   }
  // };

  // Open contact picker (Expo version)
const openContactPicker = async () => {
  try {
    console.log('[Native] 📞 Opening contact picker...');
    
    // Request permission first
    const hasPermission = await requestContactsPermission();
    
    if (!hasPermission) {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'contact-picker-result',
        success: false,
        error: 'Permission denied',
        message: 'Please grant contacts permission in app settings.'
      }));
      return;
    }

    // Get contacts using Expo API
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      pageSize: 1,
    });

    if (!data || data.length === 0) {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'contact-picker-result',
        success: false,
        error: 'No contact selected',
        message: 'No contact was selected.'
      }));
      return;
    }

    const contact = data[0];
    const firstName = contact.firstName || '';
    const lastName = contact.lastName || '';
    const fullName = contact.name || `${firstName} ${lastName}`.trim() || 'Unknown';
    
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
});