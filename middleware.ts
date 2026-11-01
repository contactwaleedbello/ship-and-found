import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware for Session Validation & RBAC (Task 5 Steps 4 & 7)
 * Intercepts protected customer routes and administrative endpoints.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get('x-request-id') ?? `mw_${crypto.randomUUID()}`;

  // Protected paths
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isCustomerProtectedPath =
    pathname.startsWith('/portal') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/api/user');

  if (!isAdminPath && !isCustomerProtectedPath) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('dg_session')?.value;

  // 1. Unauthenticated checks
  if (!sessionCookie) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required. No session cookie present.' },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Validate session via internal auth API
  try {
    const sessionCheckUrl = new URL('/api/auth/session', request.url);
    const sessionRes = await fetch(sessionCheckUrl.toString(), {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
        'x-request-id': requestId,
      },
    });

    if (!sessionRes.ok) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Session is invalid, expired, or revoked.' },
          { status: 401, headers: { 'x-request-id': requestId } }
        );
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const sessionData = await sessionRes.json();
    const user = sessionData.user;

    // 3. Admin Route RBAC Check (Step 7)
    if (isAdminPath) {
      if (user.role !== 'ADMIN') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            {
              error: 'Forbidden',
              message: 'Access denied: Administrative privileges required.',
              userRole: user.role,
              requiredRole: 'ADMIN',
            },
            { status: 403, headers: { 'x-request-id': requestId } }
          );
        }

        // Return HTTP 403 Forbidden with DG Tech Store branded error page
        const forbiddenHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>403 Forbidden — DG Tech Store</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0A0D12; color: #F0F4F8; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #161B22; border: 1px solid #E55353; border-radius: 8px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .badge { background: #3B1219; color: #FF7B72; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; margin-bottom: 16px; border: 1px solid #7D2428; }
    h1 { font-size: 24px; margin: 0 0 12px; color: #FFF; }
    p { font-size: 14px; line-height: 1.5; color: #8B949E; margin: 0 0 20px; }
    .details { background: #0D1117; border: 1px solid #30363D; border-radius: 6px; padding: 12px; font-family: monospace; font-size: 12px; text-align: left; margin-bottom: 24px; color: #58A6FF; }
    a { display: inline-block; background: #238636; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; }
    a:hover { background: #2EA043; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">HTTP 403 Forbidden</span>
    <h1>Access Denied: Admin Role Required</h1>
    <p>You are authenticated as <strong>${user.fullName}</strong> (${user.email}) with role <code>${user.role}</code>. This route is strictly reserved for Shop ATF 03 executive administrators.</p>
    <div class="details">
      Route: ${pathname}<br>
      User ID: ${user.id}<br>
      Role: ${user.role}<br>
      Enforcement: Step 7 RBAC Boundary (Forbidden != Unauthorized)
    </div>
    <a href="/portal">Return to Customer Portal</a>
  </div>
</body>
</html>`;

        return new NextResponse(forbiddenHtml, {
          status: 403,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'x-request-id': requestId,
          },
        });
      }
    }

    // Attach verified user identity headers for downstream handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-role', user.role);
    requestHeaders.set('x-user-email', user.email);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Middleware session verification failed:', error);
    // On unexpected error, fail closed
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Session validation check failed.' },
        { status: 500, headers: { 'x-request-id': requestId } }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/portal/:path*', '/profile/:path*', '/api/user/:path*'],
};

