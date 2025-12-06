// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";
import {
  loginWithEmail,
  logoutFirebase,
  sendPasswordReset,
  mapFirebaseUser,
  registerWithEmail,
} from "@/firebase/auth";
import { createUserInFirestore } from "@/services/user";
import { AppUser } from "@/types/User";


type AuthContextData = {
  user: AppUser | null;
  initializing: boolean;
  loggingIn: boolean;
  registering: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Observa login/logout do Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(mapFirebaseUser(firebaseUser));
      setInitializing(false);
    });
    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    setLoggingIn(true);
    try {
      const appUser = await loginWithEmail(email, password);
      setUser(appUser);
    } finally {
      setLoggingIn(false);
    }
  };


  // REGISTO (sem email de verificação por enquanto)
  const register = async (name: string, email: string, password: string) => {
    setRegistering(true);
    try {
      const newUser = await registerWithEmail(name, email, password);

      // Modelo AppUser para salvar no Firestore
      const appUser: AppUser = {
        uid: newUser.uid,
        email: newUser.email,
        name: newUser.name ?? name,
      };

      await createUserInFirestore(appUser);

      await logoutFirebase();
    } finally {
      setRegistering(false);
    }
  };




  const logout = async () => {
    await logoutFirebase();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordReset(email);
  };

  const value: AuthContextData = {
    user,
    initializing,
    loggingIn,
    registering,
    login,
    register,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
