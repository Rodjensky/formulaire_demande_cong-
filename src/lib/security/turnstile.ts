/**
 * Cloudflare Turnstile token validation.
 * In development or when TURNSTILE_SECRET_KEY is not configured, validation passes automatically.
 */
export async function verifyTurnstileToken(token?: string, ip?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey || secretKey === "dummy-secret-key-for-dev") {
    // Development / demo mode bypass
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) {
      formData.append("remoteip", ip);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as { success: boolean; "error-codes"?: string[] };
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return false;
  }
}
