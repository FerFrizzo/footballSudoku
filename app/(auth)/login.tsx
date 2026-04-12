import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';

import { supabase, isSupabaseConfigured } from '@/src/services/supabase';
import { useGameStore } from '@/src/state/gameStore';
import { trackEvent } from '@/src/services/analytics';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const setAuthenticated = useGameStore((s) => s.setAuthenticated);
  const deviceId = useGameStore((s) => s.deviceId);


  async function handleAuth() {
    if (!email.trim() || !password.trim()) {
      setError(t('auth.errorEmailPassword'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.errorPasswordLength'));
      return;
    }

    setError('');
    setLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      await trackEvent(
        'login_success',
        { method: 'dev_bypass' },
        'dev-user',
        deviceId
      );
      setAuthenticated(true, 'dev-user');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          await trackEvent(
            'login_success',
            { method: 'signup' },
            data.user.id,
            deviceId
          );
          setAuthenticated(true, data.user.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
        if (signInError) throw signInError;
        if (data.user) {
          await trackEvent(
            'login_success',
            { method: 'signin' },
            data.user.id,
            deviceId
          );
          setAuthenticated(true, data.user.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (e: any) {
      setError(e.message || t('auth.errorFailed'));
      await trackEvent(
        'login_failure',
        { method: isSignUp ? 'signup' : 'signin', error: e.message },
        null,
        deviceId
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignIn() {
    if (!isSupabaseConfigured || !supabase) {
      await trackEvent('login_success', { method: 'dev_bypass' }, 'dev-user', deviceId);
      setAuthenticated(true, 'dev-user');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      const { data, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
        nonce: rawNonce,
      });
      if (signInError) throw signInError;
      if (data.user) {
        await trackEvent('login_success', { method: 'apple' }, data.user.id, deviceId);
        setAuthenticated(true, data.user.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // user dismissed the Apple sheet — not an error
      } else {
        setError(e.message || t('auth.errorFailed'));
        await trackEvent('login_failure', { method: 'apple', error: e.message }, null, deviceId);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!isSupabaseConfigured || !supabase) {
      await trackEvent('login_success', { method: 'dev_bypass' }, 'dev-user', deviceId);
      setAuthenticated(true, 'dev-user');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const redirectUrl = Linking.createURL('/');

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      });

      if (oauthError || !data.url) throw oauthError || new Error('No OAuth URL');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success') {
        const hashParams = new URLSearchParams(result.url.split('#')[1] ?? '');
        const queryParams = new URLSearchParams(result.url.split('?')[1]?.split('#')[0] ?? '');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = queryParams.get('code');

        let sessionData: any, sessionError: any;
        if (code) {
          ({ data: sessionData, error: sessionError } =
            await supabase.auth.exchangeCodeForSession(result.url));
        } else if (accessToken && refreshToken) {
          ({ data: sessionData, error: sessionError } =
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }));
        } else {
          throw new Error('No auth code or tokens in callback URL');
        }

        if (sessionError) throw sessionError;
        if (sessionData.session) {
          await trackEvent(
            'login_success',
            { method: 'google' },
            sessionData.session.user.id,
            deviceId
          );
          setAuthenticated(true, sessionData.session.user.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (e: any) {
      setError(e.message || t('auth.errorFailed'));
      await trackEvent('login_failure', { method: 'google', error: e.message }, null, deviceId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="football" size={48} color="#1B5E20" />
          </View>
          <Text style={styles.title}>{t('auth.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#9E9E9E"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={t('auth.email')}
              placeholderTextColor="#9E9E9E"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#9E9E9E"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={t('auth.password')}
              placeholderTextColor="#9E9E9E"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
              style={{ paddingLeft: 8 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#9E9E9E"
              />
            </Pressable>
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          {!isSupabaseConfigured && (
            <View style={styles.devBanner}>
              <Ionicons name="information-circle" size={16} color="#0277BD" />
              <Text style={styles.devText}>{t('auth.devMode')}</Text>
            </View>
          )}

          <Pressable
            onPress={handleAuth}
            disabled={loading}
            style={({ pressed }) => [
              styles.authBtn,
              {
                opacity: loading ? 0.7 : pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.authBtnText}>
                {isSignUp ? t('auth.createAccount') : t('auth.signIn')}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            style={styles.toggleBtn}
          >
            <Text style={styles.toggleText}>
              {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.noAccount')}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={handleGoogleSignIn}
            disabled={loading}
            style={({ pressed }) => [
              styles.googleBtn,
              { opacity: loading ? 0.7 : pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <Ionicons name="logo-google" size={20} color="#1B5E20" />
            <Text style={styles.googleBtnText}>{t('auth.signInWithGoogle')}</Text>
          </Pressable>

          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={14}
              style={styles.appleBtn}
              onPress={handleAppleSignIn}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F5F0' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 40,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#757575',
    textAlign: 'center',
  },
  form: {
    gap: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  error: {
    color: '#D32F2F',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E1F5FE',
    padding: 10,
    borderRadius: 10,
  },
  devText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#0277BD',
    flex: 1,
  },
  authBtn: {
    backgroundColor: '#1B5E20',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  authBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  toggleBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#1B5E20',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#9E9E9E',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 14,
    borderRadius: 14,
  },
  googleBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#1B5E20',
  },
  appleBtn: {
    width: '100%',
    height: 50,
  },
});
