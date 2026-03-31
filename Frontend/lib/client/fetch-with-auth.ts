import { auth } from "@/lib/firebase";

/**
 * Wrapper around fetch that automatically handles token refresh on 401
 * Includes automatic retry logic for expired tokens
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit & { maxRetries?: number } = {}
): Promise<Response> {
  const { maxRetries = 1, ...fetchOptions } = options;
  let retries = 0;

  while (retries <= maxRetries) {
    try {
      // Get fresh token before each attempt
      const token = await auth.currentUser?.getIdToken(true) ?? null;
      
      const headers: HeadersInit = {
        ...((fetchOptions.headers as Record<string, string>) ?? {}),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // If 401 and we have retries left, retry with force refresh
      if (response.status === 401 && retries < maxRetries) {
        console.warn("[fetchWithAuth] Got 401, refreshing token and retrying...");
        retries++;
        // Force refresh the token
        await auth.currentUser?.getIdToken(true);
        continue;
      }

      return response;
    } catch (error) {
      if (retries < maxRetries) {
        console.warn("[fetchWithAuth] Request failed, retrying...", error);
        retries++;
        continue;
      }
      throw error;
    }
  }

  throw new Error("Max retries exceeded");
}
