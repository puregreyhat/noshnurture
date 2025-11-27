/**
 * Google Assistant OAuth Authorization Endpoint
 * Redirects users to login and authorize account linking
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUri = searchParams.get('redirect_uri');
    const state = searchParams.get('state');
    const clientId = searchParams.get('client_id');

    if (!redirectUri || !state) {
      return NextResponse.json(
        { error: 'Missing redirect_uri or state parameter' },
        { status: 400 }
      );
    }

    // Build URL to your auth page with Google Assistant linking parameters
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const authUrl = new URL(`${baseUrl}/auth/assistant-link`);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    if (clientId) {
      authUrl.searchParams.set('client_id', clientId);
    }

    // Redirect to login/authorization page
    return NextResponse.redirect(authUrl.toString());

  } catch (error) {
    console.error('Assistant auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
