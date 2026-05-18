const graphBaseUrl = "https://graph.microsoft.com/v1.0";

type AzureTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type AzureProfile = {
  id?: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  department?: string;
};

type AzureGroup = {
  id?: string;
  displayName?: string;
};

export type DbRole = "EMPLOYEE" | "MANAGER" | "ADMIN";

export function isAzureSsoConfigured() {
  return Boolean(
    process.env.AZURE_AD_CLIENT_ID &&
      process.env.AZURE_AD_CLIENT_SECRET &&
      process.env.AZURE_AD_TENANT_ID,
  );
}

function tenantId() {
  return process.env.AZURE_AD_TENANT_ID ?? "common";
}

export function appBaseUrl() {
  return process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export function azureRedirectUri() {
  return process.env.AZURE_AD_REDIRECT_URI ?? `${appBaseUrl()}/api/auth/sso/callback`;
}

function azureAuthorityUrl(path: "authorize" | "token") {
  return `https://login.microsoftonline.com/${tenantId()}/oauth2/v2.0/${path}`;
}

export function buildAzureAuthorizeUrl(state: string) {
  const url = new URL(azureAuthorityUrl("authorize"));
  url.searchParams.set("client_id", process.env.AZURE_AD_CLIENT_ID ?? "");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", azureRedirectUri());
  url.searchParams.set("response_mode", "query");
  url.searchParams.set(
    "scope",
    ["openid", "profile", "email", "User.Read", "User.ReadBasic.All", "GroupMember.Read.All"].join(" "),
  );
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url;
}

export async function exchangeAzureCode(code: string) {
  const response = await fetch(azureAuthorityUrl("token"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AZURE_AD_CLIENT_ID ?? "",
      client_secret: process.env.AZURE_AD_CLIENT_SECRET ?? "",
      grant_type: "authorization_code",
      code,
      redirect_uri: azureRedirectUri(),
      scope: ["openid", "profile", "email", "User.Read", "User.ReadBasic.All", "GroupMember.Read.All"].join(" "),
    }),
  });

  if (!response.ok) {
    throw new Error(`Microsoft token exchange failed with status ${response.status}.`);
  }

  return (await response.json()) as AzureTokenResponse;
}

async function graphGet<T>(accessToken: string, path: string) {
  const response = await fetch(`${graphBaseUrl}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Microsoft Graph request failed with status ${response.status}.`);
  return (await response.json()) as T;
}

export async function getAzureProfile(accessToken: string) {
  return graphGet<AzureProfile>(
    accessToken,
    "/me?$select=id,displayName,mail,userPrincipalName,department",
  );
}

export async function getAzureManager(accessToken: string) {
  try {
    return await graphGet<AzureProfile>(
      accessToken,
      "/me/manager?$select=id,displayName,mail,userPrincipalName,department",
    );
  } catch {
    return null;
  }
}

export async function getAzureGroups(accessToken: string) {
  try {
    const result = await graphGet<{ value?: AzureGroup[] }>(
      accessToken,
      "/me/memberOf?$select=id,displayName",
    );
    return result?.value ?? [];
  } catch {
    return [];
  }
}

export function emailFromAzureProfile(profile: AzureProfile) {
  return (profile.mail || profile.userPrincipalName || "").trim().toLowerCase();
}

export function roleFromAzureGroups(groups: AzureGroup[], existingRole?: DbRole): DbRole {
  const adminGroup = (process.env.AZURE_AD_ADMIN_GROUP ?? "AtomQuest-Admins").toLowerCase();
  const managerGroup = (process.env.AZURE_AD_MANAGER_GROUP ?? "AtomQuest-Managers").toLowerCase();
  const groupNames = groups.map((group) => group.displayName?.toLowerCase()).filter(Boolean);

  if (groupNames.includes(adminGroup)) return "ADMIN";
  if (groupNames.includes(managerGroup)) return "MANAGER";

  return existingRole === "ADMIN" || existingRole === "MANAGER" ? existingRole : "EMPLOYEE";
}

export function azureGroupNames(groups: AzureGroup[]) {
  return groups
    .map((group) => group.displayName)
    .filter((name): name is string => Boolean(name));
}
