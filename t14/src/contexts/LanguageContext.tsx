import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translateText } from "@/services/translate";

type Language = "pt" | "en" | "es" | "fr";

type LanguageContextData = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (text: string) => string;
};

const LanguageContext = createContext<LanguageContextData | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "@equalpay:language";

// Cache global de traduções
const translationCache: Map<string, string> = new Map();
const pendingTranslations = new Map<string, Promise<string>>();

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("pt");
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && (saved === "pt" || saved === "en" || saved === "es" || saved === "fr")) {
        setLanguageState(saved as Language);
      }
    } catch (error) {
      console.error("Erro ao carregar idioma:", error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
      // Limpar cache ao mudar idioma
      translationCache.clear();
      pendingTranslations.clear();
      forceUpdate((prev) => prev + 1);
    } catch (error) {
      console.error("Erro ao salvar idioma:", error);
    }
  };

  const t = (text: string): string => {
    if (!text || language === "pt") {
      return text;
    }

    const cacheKey = `${language}:${text}`;
    
    // Se já está no cache, retornar tradução
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    // Se já está traduzindo, retornar texto original
    if (pendingTranslations.has(cacheKey)) {
      return text;
    }

    // Traduzir em background e atualizar cache
    const translationPromise = translateText(text, language, "pt").then((translated) => {
      translationCache.set(cacheKey, translated);
      pendingTranslations.delete(cacheKey);
      // Forçar atualização para componentes que usam este texto
      forceUpdate((prev) => prev + 1);
      return translated;
    }).catch((error) => {
      console.error("Erro ao traduzir:", error);
      pendingTranslations.delete(cacheKey);
      return text; // Retornar original em caso de erro
    });

    pendingTranslations.set(cacheKey, translationPromise);

    // Retornar texto original enquanto traduz (será atualizado no próximo render)
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage deve ser usado dentro de LanguageProvider");
  }
  return context;
};

