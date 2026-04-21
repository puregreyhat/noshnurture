import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized ESP32 Device' }, { status: 401 });
        }
        
        const token = authHeader.split(' ')[1]; 
        const supabase = await createClient();

        // 1. Authenticate to figure out who is polling
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || token;

        // 2. We use the master service role to ignore row level security rules just in case
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseService = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 3. Find the oldest unread message
        const { data, error } = await supabaseService
            .from('esp32_queue')
            .select('id, text')
            .eq('user_id', userId)
            .eq('is_read', false)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

        if (error || !data) {
            return NextResponse.json({ message: null }); // Nothing new to read
        }

        // 4. Mark it as read so it doesn't get printed 100 times
        await supabaseService
            .from('esp32_queue')
            .update({ is_read: true })
            .eq('id', data.id);

        return NextResponse.json({ message: data.text });
        
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
