import type { User as FirebaseUser } from "firebase/auth";

export const FIREBASE_AUTH_COOKIE_NAME = "vo_firebase_token";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const COOKIE_SECURITY =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? ""
    : "; Secure";

export const setFirebaseAuthCookie = async (user: FirebaseUser) => {
  if (typeof document === "undefined") return;

  const token = await user.getIdToken();
  document.cookie = `${FIREBASE_AUTH_COOKIE_NAME}=${token}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${COOKIE_SECURITY}`;
};

export const clearFirebaseAuthCookie = () => {
  if (typeof document === "undefined") return;

  document.cookie = `${FIREBASE_AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${COOKIE_SECURITY}`;
};
