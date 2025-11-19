/**
 * Google Assistant OAuth Token Exchange Endpoint
 * Exchanges authorization code for access token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, grant_type, redirect_uri, client_id, client_secret } = body;

    console.log('Token exchange request:', { code, grant_type, redirect_uri });

    // Verify client credentials (if set)
    const expectedClientId = process.env.GOOGLE_ASSISTANT_CLIENT_ID;
    const expectedClientSecret = process.env.GOOGLE_ASSISTANT_CLIENT_SECRET;

    if (expectedClientId && client_id !== expectedClientId) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Invalid client ID' },
        { status: 401 }
      );
    }

    if (expectedClientSecret && client_secret !== expectedClientSecret) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Invalid client secret' },
        { status: 401 }
      );
    }

    if (grant_type === 'authorization_code') {
      // Exchange authorization code for Supabase session
      const supabase = await createClient();

      // The "code" here is actually the Supabase access token we passed
      // In a real OAuth flow, you'd validate the code and exchange it
      // For simplicity, we're treating the code as the access token
      
      // Verify the token is valid
      const { data: { user }, error } = await supabase.auth.getUser(code);

      if (error || !user) {
        console.error('Token validation error:', error);
        return NextResponse.json(
          { error: 'invalid_grant', error_description: 'Invalid authorization code' },
          { status: 400 }
        );
      }

      // Return access token response
      return NextResponse.json({
        access_token: code,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: code, // In production, use a real refresh token
      });

    } else if (grant_type === 'refresh_token') {
      // Handle refresh token flow
      const { refresh_token } = body;

      if (!refresh_token) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'Missing refresh_token' },
          { status: 400 }
        );
      }

      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser(refresh_token);

      if (error || !user) {
        return NextResponse.json(
          { error: 'invalid_grant', error_description: 'Invalid refresh token' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        access_token: refresh_token,
        token_type: 'Bearer',
        expires_in: 3600,
      });

    } else {
      return NextResponse.json(
        { error: 'unsupported_grant_type' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Token endpoint error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
