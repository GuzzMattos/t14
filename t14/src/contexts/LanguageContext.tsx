import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Language = "pt" | "en" | "es" | "fr";

type LanguageContextData = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextData | undefined>(undefined);

// Traduções básicas (pode ser expandido)
const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Home
    "home.title": "Início",
    "home.totalMonth": "Total do mês",
    "home.yourBalance": "Seu saldo",
    "home.recentActivity": "Atividade recente",
    "home.noActivity": "Nenhuma atividade recente",
    
    // Profile
    "profile.title": "Perfil",
    "profile.edit": "Editar perfil",
    "profile.name": "Nome",
    "profile.nickname": "Nickname",
    "profile.phone": "Telefone",
    "profile.email": "Email",
    "profile.password": "Senha",
    "profile.notifications": "Notificações",
    "profile.language": "Idioma",
    "profile.logout": "Sair",
    "profile.deleteAccount": "Apagar conta",
    "profile.notDefined": "Não definido",
    
    // Groups
    "groups.title": "Grupos",
    "groups.create": "Criar grupo",
    "groups.members": "Membros",
    "groups.expenses": "Despesas",
    "groups.balances": "Saldos",
    
    // Friends
    "friends.title": "Amigos",
    "friends.add": "Adicionar amigo",
    
    // Notifications
    "notifications.title": "Notificações",
    "notifications.empty": "Nenhuma notificação",
    
    // Common
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.confirm": "Confirmar",
    "common.delete": "Apagar",
    "common.edit": "Editar",
    "common.loading": "Carregando...",
    "common.error": "Erro",
    "common.success": "Sucesso",
  },
  en: {
    "home.title": "Home",
    "home.totalMonth": "Total this month",
    "home.yourBalance": "Your balance",
    "home.recentActivity": "Recent activity",
    "home.noActivity": "No recent activity",
    
    "profile.title": "Profile",
    "profile.edit": "Edit profile",
    "profile.name": "Name",
    "profile.nickname": "Nickname",
    "profile.phone": "Phone",
    "profile.email": "Email",
    "profile.password": "Password",
    "profile.notifications": "Notifications",
    "profile.language": "Language",
    "profile.logout": "Logout",
    "profile.deleteAccount": "Delete account",
    "profile.notDefined": "Not defined",
    
    "groups.title": "Groups",
    "groups.create": "Create group",
    "groups.members": "Members",
    "groups.expenses": "Expenses",
    "groups.balances": "Balances",
    
    "friends.title": "Friends",
    "friends.add": "Add friend",
    
    "notifications.title": "Notifications",
    "notifications.empty": "No notifications",
    
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
  },
  es: {
    "home.title": "Inicio",
    "home.totalMonth": "Total del mes",
    "home.yourBalance": "Tu saldo",
    "home.recentActivity": "Actividad reciente",
    "home.noActivity": "Sin actividad reciente",
    
    "profile.title": "Perfil",
    "profile.edit": "Editar perfil",
    "profile.name": "Nombre",
    "profile.nickname": "Nickname",
    "profile.phone": "Teléfono",
    "profile.email": "Email",
    "profile.password": "Contraseña",
    "profile.notifications": "Notificaciones",
    "profile.language": "Idioma",
    "profile.logout": "Salir",
    "profile.deleteAccount": "Eliminar cuenta",
    "profile.notDefined": "No definido",
    
    "groups.title": "Grupos",
    "groups.create": "Crear grupo",
    "groups.members": "Miembros",
    "groups.expenses": "Gastos",
    "groups.balances": "Saldos",
    
    "friends.title": "Amigos",
    "friends.add": "Agregar amigo",
    
    "notifications.title": "Notificaciones",
    "notifications.empty": "Sin notificaciones",
    
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.confirm": "Confirmar",
    "common.delete": "Eliminar",
    "common.edit": "Editar",
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.success": "Éxito",
  },
  fr: {
    "home.title": "Accueil",
    "home.totalMonth": "Total du mois",
    "home.yourBalance": "Votre solde",
    "home.recentActivity": "Activité récente",
    "home.noActivity": "Aucune activité récente",
    
    "profile.title": "Profil",
    "profile.edit": "Modifier le profil",
    "profile.name": "Nom",
    "profile.nickname": "Surnom",
    "profile.phone": "Téléphone",
    "profile.email": "Email",
    "profile.password": "Mot de passe",
    "profile.notifications": "Notifications",
    "profile.language": "Langue",
    "profile.logout": "Déconnexion",
    "profile.deleteAccount": "Supprimer le compte",
    "profile.notDefined": "Non défini",
    
    "groups.title": "Groupes",
    "groups.create": "Créer un groupe",
    "groups.members": "Membres",
    "groups.expenses": "Dépenses",
    "groups.balances": "Soldes",
    
    "friends.title": "Amis",
    "friends.add": "Ajouter un ami",
    
    "notifications.title": "Notifications",
    "notifications.empty": "Aucune notification",
    
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.confirm": "Confirmer",
    "common.delete": "Supprimer",
    "common.edit": "Modifier",
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.success": "Succès",
  },
};

const LANGUAGE_STORAGE_KEY = "@equalpay:language";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("pt");

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
    } catch (error) {
      console.error("Erro ao salvar idioma:", error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
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

