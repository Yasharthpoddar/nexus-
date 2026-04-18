require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// We use the REST API bindings instead of raw Postgres TCP pools to prevent host mapping failures natively on Windows.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
