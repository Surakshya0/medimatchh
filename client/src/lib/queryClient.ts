import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get the base URL
    const baseUrl = queryKey[0] as string;
    
    // Check if we have query parameters as the second element in the array
    let url = baseUrl;
    if (queryKey.length > 1 && typeof queryKey[1] === 'object') {
      const queryParams = new URLSearchParams();
      const paramsObj = queryKey[1] as Record<string, string>;
      
      // Add all params to the URLSearchParams object
      Object.entries(paramsObj).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
      
      // If we have params, append them to the URL
      const queryString = queryParams.toString();
      if (queryString) {
        url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${queryString}`;
      }
    }
    
    console.log('Making API request to:', url);
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes — auto-refresh but avoid excessive refetching
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
