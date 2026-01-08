// src/firebase/storage.ts
// Usando Imgur API (gratuito) em vez do Firebase Storage
import { auth } from "./config";

// Client ID do Imgur (público, pode ser usado no frontend)
// Para projetos de estudo, você pode usar este ou criar sua própria conta gratuita em https://api.imgur.com/oauth2/addclient
const IMGUR_CLIENT_ID = '546c25a59c58ad7'; // Client ID público do Imgur para testes

/**
 * Converte uma URI local para base64
 */
async function uriToBase64(uri: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remover o prefixo data:image/...;base64,
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('Erro ao converter imagem para base64');
  }
}

/**
 * Faz upload de uma imagem para o Imgur (gratuito)
 * @param userId - ID do usuário
 * @param imageUri - URI da imagem (local ou base64)
 * @returns URL de download da imagem
 */
export async function uploadAvatar(userId: string, imageUri: string): Promise<string> {
  try {
    // Verificar se o usuário está autenticado
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Usuário não autenticado. Faça login novamente.");
    }

    if (user.uid !== userId) {
      throw new Error("Você só pode fazer upload de avatar para sua própria conta.");
    }

    console.log("Iniciando upload do avatar para usuário:", userId);
    console.log("URI da imagem:", imageUri);

    // Converter imagem para base64
    let base64Image: string;
    try {
      if (imageUri.startsWith('data:')) {
        // Já está em base64
        base64Image = imageUri.split(',')[1];
      } else {
        // Converter URI local para base64
        base64Image = await uriToBase64(imageUri);
      }
    } catch (error: any) {
      throw new Error(`Erro ao processar a imagem: ${error.message}`);
    }

    // Fazer upload para Imgur
    console.log("Fazendo upload para Imgur...");
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        type: 'base64',
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.data?.error || 'Erro ao fazer upload para Imgur');
    }

    const imageUrl = data.data.link;
    console.log("Upload concluído! URL:", imageUrl);

    return imageUrl;
  } catch (error: any) {
    console.error("Erro ao fazer upload do avatar:", error);
    const errorMessage = error.message || "Erro ao fazer upload da imagem. Verifique sua conexão e tente novamente.";
    throw new Error(errorMessage);
  }
}

/**
 * Remove o avatar do Imgur
 * Nota: Imgur não permite deletar imagens anônimas via API sem autenticação
 * Para projetos de estudo, isso não é crítico
 * @param avatarUrl - URL do avatar a ser removido
 */
export async function deleteAvatar(avatarUrl: string): Promise<void> {
  try {
    if (!avatarUrl) return;

    // Imgur não permite deletar imagens anônimas sem autenticação
    // Para projetos de estudo, apenas logamos
    console.log("Avatar do Imgur não pode ser deletado sem autenticação. URL:", avatarUrl);
    console.log("Para projetos de estudo, isso não é um problema.");
  } catch (error) {
    console.error("Erro ao remover avatar:", error);
    // Não lançar erro, apenas logar
  }
}

