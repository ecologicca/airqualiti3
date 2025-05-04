const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// For Supabase Client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// For direct Postgres connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL // This will be the Render connection string
});

module.exports = {
    supabase,
    pool
}; 