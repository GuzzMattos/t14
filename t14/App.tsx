
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import Root from '@/navigation/RootNavigator';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setupNotificationListeners } from '@/services/pushNotifications';
 
// Versão final com o contexto de autenticação e navegação
export default function App() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Configurar listeners de notificação
    const cleanup = setupNotificationListeners(
      (notification) => {
        console.log('Notificação recebida:', notification);
      },
      (response) => {
        console.log('Notificação tocada:', response);
        // Aqui você pode navegar para a tela apropriada baseado na notificação
      }
    );

    return cleanup;
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <Root />
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
