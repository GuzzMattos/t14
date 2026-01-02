// src/services/sendPushNotification.ts
import { getUserFromFirestore } from './user';

/**
 * Envia uma notificação push para um usuário
 */
/**
 * Envia uma notificação push para um usuário
 * MODO TESTE: Funciona apenas com Expo Go em desenvolvimento
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<void> {
  try {
    console.log('🔔 ===== INICIANDO ENVIO DE PUSH NOTIFICATION =====');
    console.log('📱 userId:', userId);
    console.log('📝 title:', title);
    console.log('📝 body:', body);
    
    // Buscar dados do usuário incluindo pushToken
    const user = await getUserFromFirestore(userId);
    
    if (!user) {
      console.error('❌ Usuário não encontrado:', userId);
      return;
    }

    const pushToken = (user as any).pushToken;
    
    if (!pushToken) {
      console.error('❌ Usuário não tem token de push registrado:', userId);
      console.log('💡 Dica: Certifique-se de que o app solicitou permissão de notificação');
      return;
    }

    console.log('✅ Token encontrado:', pushToken);

    // Enviar notificação via Expo Push Notification API
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
      badge: 1,
      priority: 'high',
    };

    console.log('📤 Enviando para Expo API...', JSON.stringify(message, null, 2));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    console.log('📥 Status da resposta:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao enviar push notification:', errorText);
      console.error('❌ Status:', response.status);
      return;
    }

    const result = await response.json();
    console.log('✅ ===== PUSH NOTIFICATION ENVIADA COM SUCESSO =====');
    console.log('📊 Resultado:', JSON.stringify(result, null, 2));
    
    // Verificar se há erros na resposta
    if (result.data && result.data.status === 'error') {
      console.error('❌ Erro na resposta da API:', result.data.message);
    } else {
      console.log('✅ Notificação deve aparecer no dispositivo em breve!');
    }
  } catch (error: any) {
    console.error('❌ Erro ao enviar push notification:', error);
    console.error('❌ Stack:', error.stack);
  }
}

