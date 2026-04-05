import { createContext, useContext, useEffect, useState } from "react";
import { subscribeToAuthChanges, logoutUser } from "../services/authService";
import { getUserProfile } from "../services/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setCurrentUser(user);
      setProfileError("");

      if (!user) {
        setUserProfile(null);
        setAuthLoading(false);
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error loading user profile:", error);
        setUserProfile(null);
        setProfileError("Failed to load user profile.");
      } finally {
        setAuthLoading(false);
        setProfileLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function logout() {
    await logoutUser();
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        authLoading,
        profileLoading,
        profileError,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}