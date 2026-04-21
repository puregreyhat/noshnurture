import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { text } = await request.json();
        if (!text) return NextResponse.json({ error: 'No text' }, { status: 400 });
        
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return NextResponse.json({ error: 'Auth failed' }, { status: 401 });

        // Use service role to bypass Row Level Security rules
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseService = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabaseService.from('esp32_queue').insert({
            user_id: user.id,
            text: text
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
