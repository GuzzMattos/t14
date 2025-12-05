import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import {
  AppUser,
  loginWithEmail,
  logoutFirebase,
  sendPasswordReset,
  mapFirebaseUser,
  registerWithEmail,
} from "@/firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
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

  const register = async (name: string, email: string, password: string) => {
    setRegistering(true);
    try {
      await registerWithEmail(name, email, password);

      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        const userRef = doc(db, "user", firebaseUser.uid);

        await setDoc(
          userRef,
          {
            primeiroNome: name, 
            email: email,
            nickname: name, 
            avatar: "",    
            telefone: "",  
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

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
