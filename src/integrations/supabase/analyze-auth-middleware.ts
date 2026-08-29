/**
 * Self-contained auth middleware for the analyzeNewsServer function.
 *
 * Has both .client() and .server() parts so it does NOT depend on the
 * global attachSupabaseAuth middleware. The global middleware is preserved
 * for other Server Functions.
 *
 * Client side:
 *   - Reads the Supabase session from the browser
 *   - Injects Authorization header via next()
 *
 * Server side:
 *   - Reads the Authorization header from the incoming request
 *   - Validates the JWT with Supabase
 *   - Creates a user-scoped Supabase client
 *   - Passes { supabase, userId, claims } in context
 */
import { createMiddleware } from '@tanstack/react-start'

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export const analyzeAuthMiddleware = createMiddleware({ type: 'function' })
  .client(async ({ next }) => {
    // Dynamic import so the browser Supabase client is only loaded client-side
    const { supabase } = await import('./client');

    const { data, error } = await supabase.auth.getSession();
    const sessionFound = !error && !!data?.session;

    console.log(
      '[ANALYZE AUTH CLIENT]',
      `SESSION_FOUND=${sessionFound}`,
    );

    if (!sessionFound || !data?.session?.access_token) {
      console.log('[ANALYZE AUTH CLIENT]', 'AUTH_HEADER_PREPARED=false');
      throw new Error('É necessário estar autenticado.');
    }

    console.log('[ANALYZE AUTH CLIENT]', 'AUTH_HEADER_PREPARED=true');

    return next({
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
    });
  })
  .server(async ({ next }) => {
    console.log('[ANALYZE AUTH SERVER]', 'REQUEST_RECEIVED=true');

    // ── Read env vars ────────────────────────────────────────────────
    const SUPABASE_URL = process.env['SUPABASE_URL'];
    const SUPABASE_PUBLISHABLE_KEY = process.env['SUPABASE_PUBLISHABLE_KEY'];

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      const missing = [
        ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
        ...(!SUPABASE_PUBLISHABLE_KEY ? ['SUPABASE_PUBLISHABLE_KEY'] : []),
      ];
      const message = `Missing Supabase environment variable(s): ${missing.join(', ')}. Connect Supabase in Lovable Cloud.`;
      console.error(`[ANALYZE AUTH SERVER] ${message}`);
      throw new Error(message);
    }

    // ── Read Authorization header from the request ───────────────────
    const { getRequest } = await import('@tanstack/react-start/server');
    const request = getRequest();

    if (!request?.headers) {
      console.log('[ANALYZE AUTH SERVER]', 'AUTH_HEADER_PRESENT=false (no request headers)');
      throw new Error('Unauthorized: No request headers available');
    }

    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      console.log('[ANALYZE AUTH SERVER]', 'AUTH_HEADER_PRESENT=false');
      throw new Error('Unauthorized: No authorization header provided');
    }

    console.log('[ANALYZE AUTH SERVER]', 'AUTH_HEADER_PRESENT=true');

    if (!authHeader.startsWith('Bearer ')) {
      console.log('[ANALYZE AUTH SERVER]', 'TOKEN_VALIDATED=false (not Bearer)');
      throw new Error('Unauthorized: Only Bearer tokens are supported');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token || token.split('.').length !== 3) {
      console.log('[ANALYZE AUTH SERVER]', 'TOKEN_VALIDATED=false (invalid JWT format)');
      throw new Error('Unauthorized: Invalid token format');
    }

    // ── Create user-scoped Supabase client ───────────────────────────
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        global: {
          fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    // ── Validate token ──────────────────────────────────────────────
    const { data, error } = await supabase.auth.getClaims(token);

    if (error || !data?.claims) {
      console.log('[ANALYZE AUTH SERVER]', 'TOKEN_VALIDATED=false');
      throw new Error('Unauthorized: Invalid token');
    }

    if (!data.claims.sub) {
      console.log('[ANALYZE AUTH SERVER]', 'TOKEN_VALIDATED=false (no sub)');
      throw new Error('Unauthorized: No user ID found in token');
    }

    console.log('[ANALYZE AUTH SERVER]', 'TOKEN_VALIDATED=true', 'USER_AUTHENTICATED=true');

    return next({
      context: {
        supabase,
        userId: data.claims.sub as string,
        claims: data.claims,
      },
    });
  });
