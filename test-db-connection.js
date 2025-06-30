// Test database connection to Supabase
const { Client } = require('pg');

const testConnection = async () => {
  console.log('🔗 Testing Supabase Database Connection...');
  console.log('=' .repeat(50));

  const connectionString = "postgres://postgres.uqbqwtikpekoqcxjamid:xoobzyQbneLFvQeu@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
  
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log('📡 Attempting to connect to database...');
    await client.connect();
    console.log('✅ Database connection successful!');

    console.log('\n📊 Testing basic query...');
    const result = await client.query('SELECT version()');
    console.log('✅ Query successful!');
    console.log('Database version:', result.rows[0].version);

    console.log('\n📋 Checking existing tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('✅ Existing tables found:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('ℹ️  No tables found - database is empty (expected for new setup)');
    }

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 DNS resolution failed - check network connectivity');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused - check database server status');
    } else if (error.code === '28P01') {
      console.error('💡 Authentication failed - check credentials');
    }
  } finally {
    try {
      await client.end();
      console.log('\n🔌 Database connection closed');
    } catch (err) {
      // Ignore close errors
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Database connection test completed');
};

// Run the test
testConnection().catch(console.error);
