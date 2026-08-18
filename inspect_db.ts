import pool from './backend/database/db';

async function test() {
  try {
    const listRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('--- TABLES ---');
    console.log(listRes.rows.map(r => r.table_name));

    for (const table of listRes.rows) {
      const name = table.table_name;
      const columnsRes = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
      `, [name]);
      console.log(`\nTable: ${name}`);
      console.log(columnsRes.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
      
      try {
        const countRes = await pool.query(`SELECT COUNT(*) FROM public."${name}"`);
        console.log(`Rows: ${countRes.rows[0].count}`);
      } catch (inner) {
        console.log(`Error counting rows: ${inner.message}`);
      }
    }
  } catch (e) {
    console.error('Inspection failed:', e);
  } finally {
    await pool.end();
  }
}
test();
