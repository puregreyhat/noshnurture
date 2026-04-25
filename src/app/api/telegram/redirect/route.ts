import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user');

  if (!userId) {
    return NextResponse.redirect('https://noshnurture.vercel.app');
  }

  // Redirect to the mobile app scheme
  // Using a 307 Temporary Redirect
  return new Response(null, {
    status: 307,
    headers: {
      Location: `io.supabase.nosh://telegram-callback?user=${userId}`,
    },
  });
}
