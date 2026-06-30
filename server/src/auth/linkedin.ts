// "Sign in with LinkedIn" using OpenID Connect. With today's API this yields
// only the basic profile (sub, name, email, picture) - work history is not
// available without rare Partner access - so the bot's knowledge is built
// through onboarding, not imported here.

const AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

export interface LinkedInProfile {
  sub: string;
  email: string | null;
  name: string;
  avatarUrl: string | null;
}

function config() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "LinkedIn auth is not configured (LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET / LINKEDIN_REDIRECT_URI)",
    );
  }
  return { clientId, clientSecret, redirectUri };
}

export function isConfigured(): boolean {
  return Boolean(
    process.env.LINKEDIN_CLIENT_ID &&
      process.env.LINKEDIN_CLIENT_SECRET &&
      process.env.LINKEDIN_REDIRECT_URI,
  );
}

/** The LinkedIn consent URL to redirect the browser to. */
export function buildAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = config();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile email",
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

/** Exchanges an authorization code for an access token. */
export async function exchangeCode(code: string): Promise<string> {
  const { clientId, clientSecret, redirectUri } = config();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(`LinkedIn token exchange failed: ${res.status}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("LinkedIn token response had no access_token");
  return json.access_token;
}

/** Fetches the OIDC userinfo for the signed-in member. */
export async function fetchProfile(accessToken: string): Promise<LinkedInProfile> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`LinkedIn userinfo failed: ${res.status}`);
  }
  const u = (await res.json()) as {
    sub: string;
    name?: string;
    given_name?: string;
    email?: string;
    picture?: string;
  };
  return {
    sub: u.sub,
    email: u.email ?? null,
    name: u.name ?? u.given_name ?? "",
    avatarUrl: u.picture ?? null,
  };
}
