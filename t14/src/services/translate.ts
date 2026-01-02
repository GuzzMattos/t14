// src/services/translate.ts
// Tradução automática usando API gratuita do Google Translate

/**
 * Traduz um texto usando a API gratuita do Google Translate
 */
export async function translateText(text: string, targetLang: string, sourceLang: string = 'pt'): Promise<string> {
  if (!text || targetLang === sourceLang) {
    return text;
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
    
    return text;
  } catch (error) {
    console.error('Erro ao traduzir:', error);
    return text;
  }
}

