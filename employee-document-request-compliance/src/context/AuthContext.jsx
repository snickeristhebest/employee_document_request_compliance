import { createContext, useContext, useEffect, useState } from "react";
import { subscribeToAuthChanges, logoutUser } from "../services/authService";
import { subscribeToUserProfile } from "../services/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
      setProfileError("");

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!user) {
        setUserProfile(null);
        setAuthLoading(false);
        setProfileLoading(false);
        return;
      }

      setAuthLoading(false);
      setProfileLoading(true);

      unsubscribeProfile = subscribeToUserProfile(
        user.uid,
        (profile) => {
          setUserProfile(profile);
          setProfileError("");
          setProfileLoading(false);
        },
        (error) => {
          console.error("Error loading user profile:", error);
          setUserProfile(null);
          setProfileError("Failed to load user profile.");
          setProfileLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
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