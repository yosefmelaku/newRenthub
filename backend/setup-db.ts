import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Attempt to connect to the default 'postgres' database to create the new one
const adminClient = new Client({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres',
});

const DB_NAME = 'rentalsystem';

async function setupDatabase() {
  try {
    console.log('Connecting to default postgres database...');
    await adminClient.connect();
    
    // Check if database exists
    const res = await adminClient.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${DB_NAME}'`);
    if (res.rowCount === 0) {
      console.log(`Creating database ${DB_NAME}...`);
      await adminClient.query(`CREATE DATABASE ${DB_NAME}`);
      console.log('Database created successfully.');
    } else {
      console.log(`Database ${DB_NAME} already exists.`);
    }
  } catch (err) {
    console.error('Error connecting or creating database:', err);
    console.log('\n--> TIP: If this failed due to authentication, your PostgreSQL password might not be "postgres".');
    console.log('--> Please update the .env file in the backend folder with your actual password and run this script again.');
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // Now connect to the new database to create the table and insert data
  console.log(`\nConnecting to the new ${DB_NAME} database...`);
  const appClient = new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: DB_NAME,
  });

  try {
    await appClient.connect();
    
    console.log('Creating properties table...');
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        beds INTEGER,
        baths INTEGER,
        sqft INTEGER,
        image VARCHAR(255),
        featured BOOLEAN DEFAULT false
      );
    `);

    // Check if data already exists
    const checkRes = await appClient.query('SELECT COUNT(*) FROM properties');
    if (parseInt(checkRes.rows[0].count) === 0) {
      console.log('Inserting mock data...');
      const insertQuery = `
        INSERT INTO properties (title, location, price, type, beds, baths, sqft, image, featured)
        VALUES 
          ('Luxury Modern Villa', 'Beverly Hills, California', 8500, 'Villa', 5, 6, 4500, '/villa.png', true),
          ('Skyline Penthouse Apartment', 'Manhattan, New York', 6200, 'Apartment', 3, 3, 2800, '/apartment.png', false),
          ('Premium Corporate Office', 'Downtown, Chicago', 12000, 'Office', 0, 4, 8000, '/office.png', true)
      `;
      await appClient.query(insertQuery);
      console.log('Mock data inserted successfully!');
    } else {
      console.log('Table already contains data, skipping insertion.');
    }
    
    console.log('\n✅ Database setup is complete! You can now start the backend server.');
  } catch (err) {
    console.error('Error setting up tables:', err);
  } finally {
    await appClient.end();
  }
}

setupDatabase();
