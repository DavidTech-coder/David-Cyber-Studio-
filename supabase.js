// David Cyber Studio - Supabase Connection

const SUPABASE_URL =
    "https://ottueecnvdgnewsosmuo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_NrpyfIBh-sOFijbAhzQPdQ_A3nEMz2O";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

// Make it available to other JavaScript files
window.supabaseClient = supabaseClient;

console.log("✅ Supabase connected!");