// src/services/pushNotifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { updateUserInFirestore } from './user';

// Configurar como as notificações devem ser tratadas quando o app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permissões de notificação
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permissão de notificação negada');
      return null;
    }
    
    try {
      console.log('🔔 Modo TESTE: Obtendo token de push notification...');
      
      // Para Expo Go funcionar, precisamos de um projectId
      // Vamos tentar obter de várias fontes
      let projectId: string | undefined = undefined;
      
      // 1. Tentar do Constants.expoConfig
      projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                  Constants.expoConfig?.extra?.projectId;
      
      // 2. Tentar do Constants.manifest2
      if (!projectId) {
        projectId = Constants.manifest2?.extra?.eas?.projectId || 
                    Constants.manifest2?.extra?.projectId;
      }
      
      // 3. Tentar do Constants.easConfig
      if (!projectId) {
        projectId = Constants.easConfig?.projectId;
      }
      
      // 4. Tentar do Constants.manifest (legacy)
      if (!projectId && (Constants as any).manifest?.extra?.eas?.projectId) {
        projectId = (Constants as any).manifest.extra.eas.projectId;
      }
      
      if (projectId && projectId.trim() !== '') {
        console.log('✅ ProjectId encontrado:', projectId);
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId.trim(),
        });
        token = tokenData.data;
        console.log('✅ Token obtido com sucesso:', token);
      } else {
        console.log('⚠️  ProjectId não encontrado. Tentando sem projectId...');
        console.log('💡 Para funcionar melhor, adicione projectId no app.json');
        
        // Tentar sem projectId - pode funcionar em alguns casos do Expo Go
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          token = tokenData.data;
          console.log('✅ Token obtido sem projectId:', token);
        } catch (errorWithoutProjectId: any) {
          console.error('❌ Erro ao obter token:', errorWithoutProjectId.message);
          console.log('');
          console.log('🔧 SOLUÇÃO RÁPIDA:');
          console.log('   1. Acesse: https://expo.dev');
          console.log('   2. Crie uma conta/login');
          console.log('   3. Crie um novo projeto');
          console.log('   4. Copie o projectId');
          console.log('   5. Adicione em app.json:');
          console.log('      "extra": { "eas": { "projectId": "seu-project-id-aqui" } }');
          console.log('');
          console.log('   Ou execute no terminal:');
          console.log('   npx eas init');
          return null;
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao obter token:', error.message);
      return null;
    }
  } else {
    console.log('Deve usar um dispositivo físico para Push Notifications');
  }

  return token;
}

/**
 * Registra o token de push no Firestore
 */
export async function registerPushToken(userId: string): Promise<void> {
  try {
    console.log('🔔 ===== REGISTRANDO PUSH TOKEN =====');
    console.log('👤 userId:', userId);
    
    const token = await registerForPushNotificationsAsync();
    
    if (token) {
      console.log('✅ Token obtido:', token);
      console.log('💾 Salvando no Firestore...');
      
      await updateUserInFirestore(userId, { pushToken: token } as any);
      console.log('✅ Token salvo no Firestore!');
      
      // Verificar se foi salvo
      const { getUserFromFirestore } = await import('@/services/user');
      const user = await getUserFromFirestore(userId);
      if (user && (user as any).pushToken) {
        console.log('✅ Confirmação: Token verificado no Firestore:', (user as any).pushToken);
        console.log('✅ Token coincide:', (user as any).pushToken === token);
      } else {
        console.error('❌ ERRO: Token não encontrado no Firestore após salvar!');
      }
    } else {
      console.error('❌ ERRO: Não foi possível obter token de push');
      console.log('💡 Verifique:');
      console.log('   1. Se está usando um dispositivo físico (não emulador)');
      console.log('   2. Se permitiu notificações quando o app pediu');
      console.log('   3. Se está usando Expo Go');
    }
  } catch (error: any) {
    console.error('❌ Erro ao registrar token de push:', error);
    console.error('❌ Stack:', error.stack);
  }
}

/**
 * Função de TESTE: Envia uma notificação push de teste
 */
export async function sendTestPushNotification(userId: string): Promise<void> {
  try {
    console.log('🧪 ===== ENVIANDO NOTIFICAÇÃO DE TESTE =====');
    
    const { getUserFromFirestore } = await import('@/services/user');
    const user = await getUserFromFirestore(userId);
    
    if (!user) {
      console.error('❌ Usuário não encontrado');
      return;
    }
    
    const pushToken = (user as any).pushToken;
    
    if (!pushToken) {
      console.error('❌ Usuário não tem token. Registrando...');
      await registerPushToken(userId);
      // Tentar novamente após registrar
      const userAfter = await getUserFromFirestore(userId);
      const newToken = (userAfter as any)?.pushToken;
      if (!newToken) {
        console.error('❌ Ainda não há token após registro');
        return;
      }
      await sendTestPushWithToken(newToken);
      return;
    }
    
    await sendTestPushWithToken(pushToken);
  } catch (error: any) {
    console.error('❌ Erro ao enviar teste:', error);
  }
}

async function sendTestPushWithToken(token: string): Promise<void> {
  const message = {
    to: token,
    sound: 'default',
    title: '🧪 Teste de Notificação',
    body: 'Se você está vendo isso, as push notifications estão funcionando!',
    data: { test: true },
    badge: 1,
    priority: 'high',
  };

  console.log('📤 Enviando teste para:', token);
  console.log('📝 Mensagem:', JSON.stringify(message, null, 2));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  const result = await response.json();
  console.log('📥 Resposta:', JSON.stringify(result, null, 2));
  
  if (result.data && result.data.status === 'ok') {
    console.log('✅ TESTE ENVIADO COM SUCESSO! Verifique seu celular!');
  } else {
    console.error('❌ Erro no teste:', result);
  }
}

/**
 * Obtém o token de push do usuário atual
 */
export async function getPushToken(): Promise<string | null> {
  try {
    const token = await registerForPushNotificationsAsync();
    return token;
  } catch (error) {
    console.error('Erro ao obter token de push:', error);
    return null;
  }
}

/**
 * Configura listeners de notificação
 */
export function setupNotificationListeners(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationTapped: (response: Notifications.NotificationResponse) => void
) {
  // Listener para quando uma notificação é recebida (app em foreground)
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    onNotificationReceived
  );

  // Listener para quando o usuário toca em uma notificação
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    onNotificationTapped
  );

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

