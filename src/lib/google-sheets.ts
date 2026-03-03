import { createSign } from 'node:crypto';

import { WAITLIST_SHEET_DEFAULT_NAME } from './waitlist';

const GOOGLE_OAUTH_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_SHEETS_API_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const GOOGLE_SHEETS_API_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const GOOGLE_SHEETS_APPEND_QUERY = new URLSearchParams({
  insertDataOption: 'INSERT_ROWS',
  valueInputOption: 'RAW',
}).toString();

interface GoogleAccessTokenResponse {
  access_token: string;
  expires_in: number;
}

interface GoogleServiceAccountConfig {
  clientEmail: string;
  privateKey: string;
  sheetName: string;
  spreadsheetId: string;
}

interface TokenCache {
  accessToken: string;
  expiresAtMs: number;
}

let cachedToken: null | TokenCache = null;

export async function appendWaitlistRow({
  email,
  submittedAtUtc,
}: {
  email: string;
  submittedAtUtc: string;
}): Promise<void> {
  const config = getGoogleServiceAccountConfig();
  const accessToken = await getGoogleAccessToken();
  const range = encodeURIComponent(`${config.sheetName}!A:B`);
  const response = await fetch(
    `${GOOGLE_SHEETS_API_BASE_URL}/${config.spreadsheetId}/values/${range}:append?${GOOGLE_SHEETS_APPEND_QUERY}`,
    {
      body: JSON.stringify({
        majorDimension: 'ROWS',
        values: [[submittedAtUtc, email]],
      }),
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(`Google Sheets append failed with ${response.status}: ${responseBody}`);
  }
}

function base64UrlEncode(value: Buffer | string): string {
  return Buffer.from(value)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function createServiceAccountAssertion(config: GoogleServiceAccountConfig): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;

  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64UrlEncode(
    JSON.stringify({
      aud: GOOGLE_OAUTH_TOKEN_ENDPOINT,
      exp: expiresAt,
      iat: issuedAt,
      iss: config.clientEmail,
      scope: GOOGLE_SHEETS_API_SCOPE,
    }),
  );
  const unsignedToken = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');

  signer.update(unsignedToken);
  signer.end();

  const signature = base64UrlEncode(signer.sign(config.privateKey));

  return `${unsignedToken}.${signature}`;
}

async function getGoogleAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAtMs > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const config = getGoogleServiceAccountConfig();
  const body = new URLSearchParams({
    assertion: createServiceAccountAssertion(config),
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
  });
  const response = await fetch(GOOGLE_OAUTH_TOKEN_ENDPOINT, {
    body,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });
  const rawPayload = await response.text();

  if (!response.ok) {
    throw new Error(`Google OAuth token request failed with ${response.status}: ${rawPayload}`);
  }

  const payload = JSON.parse(rawPayload) as Partial<GoogleAccessTokenResponse>;

  if (!payload.access_token || !payload.expires_in) {
    throw new Error('Google OAuth token response did not include an access token');
  }

  cachedToken = {
    accessToken: payload.access_token,
    expiresAtMs: Date.now() + payload.expires_in * 1000,
  };

  return cachedToken.accessToken;
}

function getGoogleServiceAccountConfig(): GoogleServiceAccountConfig {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME ?? WAITLIST_SHEET_DEFAULT_NAME;

  if (!clientEmail) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL');
  }

  if (!privateKey) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
  }

  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEETS_SPREADSHEET_ID');
  }

  return {
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
    sheetName,
    spreadsheetId,
  };
}
