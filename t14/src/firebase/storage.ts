// src/firebase/storage.ts
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, auth } from "./config";

/**
 * Faz upload de uma imagem para o Firebase Storage
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

    let blob: Blob;

    // No Expo/React Native, fetch funciona com URIs locais
    // Se for uma URI local (file:// ou content://) ou URL remota
    try {
      console.log("Fazendo fetch da imagem...");
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`Erro ao ler a imagem: ${response.status} ${response.statusText}`);
      }
      blob = await response.blob();
      console.log("Blob criado com sucesso. Tamanho:", blob.size, "bytes");
    } catch (fetchError: any) {
      console.error("Erro ao fazer fetch da imagem:", fetchError);
      throw new Error(`Erro ao processar a imagem: ${fetchError.message || 'Não foi possível ler o arquivo'}`);
    }

    // Verificar se o blob é válido
    if (!blob || blob.size === 0) {
      throw new Error("A imagem selecionada está vazia ou inválida");
    }

    // Verificar tamanho (limite de 5MB)
    if (blob.size > 5 * 1024 * 1024) {
      throw new Error("A imagem é muito grande. Tamanho máximo: 5MB");
    }

    // Criar referência no storage
    const imagePath = `avatars/${userId}/${Date.now()}.jpg`;
    const imageRef = ref(storage, imagePath);
    console.log("Caminho no storage:", imagePath);

    // Fazer upload com metadata
    console.log("Iniciando upload para Firebase Storage...");
    await uploadBytes(imageRef, blob, {
      contentType: 'image/jpeg',
    });
    console.log("Upload concluído com sucesso!");

    // Obter URL de download
    const downloadURL = await getDownloadURL(imageRef);
    console.log("URL de download obtida:", downloadURL);

    return downloadURL;
  } catch (error: any) {
    console.error("Erro ao fazer upload do avatar:", error);
    // Log detalhado do erro
    if (error.code) {
      console.error("Código do erro:", error.code);
    }
    if (error.message) {
      console.error("Mensagem do erro:", error.message);
    }
    if (error.serverResponse) {
      console.error("Resposta do servidor:", error.serverResponse);
    }
    if (error.customData) {
      console.error("Dados customizados:", error.customData);
    }

    // Mensagens mais específicas baseadas no código do erro
    let errorMessage = error.message || "Erro ao fazer upload da imagem. Verifique sua conexão e tente novamente.";

    if (error.code === 'storage/unauthorized') {
      errorMessage = "Você não tem permissão para fazer upload. Verifique as regras do Storage.";
    } else if (error.code === 'storage/unknown') {
      errorMessage = "Erro desconhecido no Storage. Verifique se as regras do Storage foram aplicadas corretamente no Firebase Console.";
    } else if (error.code === 'storage/quota-exceeded') {
      errorMessage = "Limite de armazenamento excedido.";
    } else if (error.code === 'storage/unauthenticated') {
      errorMessage = "Você precisa estar autenticado para fazer upload de imagens.";
    }

    throw new Error(errorMessage);
  }
}

/**
 * Remove o avatar do Firebase Storage
 * @param avatarUrl - URL do avatar a ser removido
 */
export async function deleteAvatar(avatarUrl: string): Promise<void> {
  try {
    if (!avatarUrl) return;

    // Tentar extrair o path da URL do Firebase Storage
    // Formato: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?alt=media&token=TOKEN
    const url = new URL(avatarUrl);

    // Extrair o path após '/o/'
    let path = '';
    if (url.pathname.includes('/o/')) {
      path = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] || '');
    } else {
      // Tentar outro formato de URL
      const match = avatarUrl.match(/\/o\/([^?]+)/);
      if (match) {
        path = decodeURIComponent(match[1]);
      }
    }

    if (path) {
      const imageRef = ref(storage, path);
      await deleteObject(imageRef);
    } else {
      console.warn("Não foi possível extrair o path da URL do avatar:", avatarUrl);
    }
  } catch (error) {
    console.error("Erro ao remover avatar:", error);
    // Não lançar erro, apenas logar, pois pode não existir ou já ter sido removido
  }
}

