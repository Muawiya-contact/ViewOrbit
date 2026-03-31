/* eslint-disable @typescript-eslint/no-explicit-any */

interface VerifyTaskParams {
  provider: "youtube" | "instagram" | "facebook" | "tiktok";
  oauthToken: string;
  verificationPayload?: Record<string, any>;
}

interface VerifyTaskResult {
  verified: boolean;
  reason?: string;
  metadata?: Record<string, any>;
}

export async function verifyTaskCompletionWithProvider({
  provider,
  oauthToken,
  verificationPayload,
}: VerifyTaskParams): Promise<VerifyTaskResult> {
  if (!oauthToken) {
    return { verified: false, reason: "Missing OAuth token" };
  }

  if (!verificationPayload?.referenceId) {
    return { verified: false, reason: "Missing verification reference" };
  }

  if (provider === "youtube") {
    const response = await fetch("https://www.googleapis.com/youtube/v3/channels?part=id&mine=true", {
      headers: {
        Authorization: `Bearer ${oauthToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { verified: false, reason: "YouTube verification failed" };
    }

    return {
      verified: true,
      metadata: {
        provider,
        referenceId: verificationPayload.referenceId,
      },
    };
  }

  if (provider === "instagram") {
    return {
      verified: true,
      metadata: {
        provider,
        referenceId: verificationPayload.referenceId,
      },
    };
  }

  if (provider === "facebook") {
    return {
      verified: true,
      metadata: {
        provider,
        referenceId: verificationPayload.referenceId,
      },
    };
  }

  if (provider === "tiktok") {
    return {
      verified: true,
      metadata: {
        provider,
        referenceId: verificationPayload.referenceId,
      },
    };
  }

  return { verified: false, reason: "Unsupported provider" };
}
