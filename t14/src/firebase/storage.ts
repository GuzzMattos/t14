// src/firebase/storage.ts
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

/**
 * Faz upload de uma imagem para o Firebase Storage
 * @param userId - ID do usuário
 * @param imageUri - URI da imagem (local ou base64)
 * @returns URL de download da imagem
 */
export async function uploadAvatar(userId: string, imageUri: string): Promise<string> {
  try {
    // Converter URI para blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Criar referência no storage
    const imageRef = ref(storage, `avatars/${userId}/${Date.now()}.jpg`);
    
    // Fazer upload
    await uploadBytes(imageRef, blob);
    
    // Obter URL de download
    const downloadURL = await getDownloadURL(imageRef);
    
    return downloadURL;
  } catch (error) {
    console.error("Erro ao fazer upload do avatar:", error);
    throw error;
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

