const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
    const { data } = await supabase.from('inventory_items').select('*').eq('is_consumed', false);
    console.log(data.map(d => d.product_name));
}
run();
