import Constants from "expo-constants";

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl;

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  token?: string | null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, token } = options;

  if (!apiBaseUrl) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL is not set. Cannot make API requests."
    );
  }

  const url = `${apiBaseUrl}${endpoint}`;
  console.log("[apiRequest] Full URL:", url);

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
    console.log("[apiRequest] Auth header set with token");
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export { apiBaseUrl };
