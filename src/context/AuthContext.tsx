import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

interface AuthContextType {
  login: (email: string, password: string, role: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: string, termsAccepted?: boolean) => Promise<void>;
  googleLogin: (credential: string, role: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  user: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on app startup
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error loading user from localStorage:", error);
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();

    // Listen for storage changes from other tabs (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user" || e.key === "token") {
        loadUserFromStorage();
      }
    };

    // Listen for custom auth events (same-tab updates)
    const handleAuthChange = () => {
      loadUserFromStorage();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChange", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  const login = async (email: string, password: string, role: string) => {
    setIsLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password, role });
      
      // Save token & user in localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setUser(res.data.user);
      
      // Dispatch custom event to notify other tabs/windows
      window.dispatchEvent(new Event("authChange"));
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, role: string, termsAccepted: boolean = false) => {
    setIsLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/signup", { name, email, password, role, termsAccepted });
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (credential: string, role: string) => {
    setIsLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/google", { credential, role });
      
      // Save token & user in localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setUser(res.data.user);
      
      // Dispatch custom event to notify other tabs/windows
      window.dispatchEvent(new Event("authChange"));
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear temporary resume data on logout
    localStorage.removeItem("tempResumeData");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    
    // Dispatch custom event to notify other tabs/windows
    window.dispatchEvent(new Event("authChange"));
  };

  return (
    <AuthContext.Provider value={{ login, signup, googleLogin, logout, isLoading, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
