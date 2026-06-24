# Windows Setup Guide for AR Dashboard

If you're on Windows, follow these instructions to set up the database properly.

## Method 1: Using npm (Recommended)

This method uses `cross-env` to handle environment variables cross-platform:

```bash
npm run setup:db
```

This command:
- Automatically sets `NODE_TLS_REJECT_UNAUTHORIZED=0` for SSL certificate handling
- Runs the database setup script
- Works on Windows, macOS, and Linux

## Method 2: Using Batch Script

Double-click `setup-db.bat` from File Explorer:

```
setup-db.bat
```

This batch script:
- Sets the required environment variables for Windows
- Runs the Node.js setup script
- Shows a completion message and pauses for you to review output
- Works on Windows Command Prompt (cmd.exe)

## Method 3: Using PowerShell Script

Open PowerShell and run:

```powershell
.\setup-db.ps1
```

If you get an execution policy error, first run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then retry the setup script.

## What Gets Set Up

Running any of these commands will:

1. Connect to your Supabase PostgreSQL database using credentials from `.env.local`
2. Execute the complete SQL schema from `supabase/full_setup.sql`
3. Create 12 database tables with proper relationships
4. Set up Row Level Security (RLS) policies
5. Create database functions and triggers
6. Seed initial data (10 categories, 7 sample products)

## Troubleshooting

### "Cannot find node command"

Ensure Node.js is installed and added to your PATH:

```bash
node --version
```

Should show a version number (e.g., v18.0.0 or higher).

### "Database connection failed"

Check that `.env.local` exists with valid Supabase credentials:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
POSTGRES_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

### "SSL certificate error"

The setup scripts automatically handle SSL certificate verification. If you still get SSL errors:

1. Using npm: Already handled by `cross-env`
2. Using batch: Already set in `setup-db.bat`
3. Using PowerShell: Already set in `setup-db.ps1`

### "Table already exists"

This is normal if you run the setup twice. The SQL includes `IF NOT EXISTS` clauses:

```bash
npm run setup:db
```

It will safely skip creating tables that already exist.

## Verify Setup Success

After running any setup method, you should see output like:

```
✅ Connected to database

📦 Reading SQL schema...
✅ SQL schema loaded (456 lines)

🔨 Executing schema setup...
✅ Database schema created successfully

📊 Seeding initial data...
✅ Successfully seeded 10 categories
✅ Successfully seeded 7 products

✨ Database setup completed in 2.34 seconds!
```

## Next Steps

Once setup is complete:

```bash
npm run dev
```

This starts the development server on http://localhost:5173

## For macOS/Linux Users

Use the standard npm command:

```bash
npm run setup:db
```

Or set the environment variable directly:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 node setup-db-postgres.js
```
