# Supabase Database Setup Instructions

Your Supabase account is connected! Now follow these steps to set up the database schema and add dummy data.

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: **gspuudllwbrqouvikuet**
3. Click on **SQL Editor** in the left sidebar

## Step 2: Create New Query

1. Click **"New Query"** button
2. Copy the entire contents from `supabase/full_setup.sql` file in this project
3. Paste it into the SQL Editor

## Step 3: Execute the SQL

1. Click the **"Run"** button (or press Cmd+Enter / Ctrl+Enter)
2. Wait for the query to complete
3. You should see a success message

## Step 4: Verify Setup

Once complete, your database will have:
- ✅ All required tables created (profiles, products, categories, orders, etc.)
- ✅ Proper indexes and constraints
- ✅ Row-Level Security (RLS) policies
- ✅ Sample data seeded

## Your Connection Details

- **Project URL**: https://gspuudllwbrqouvikuet.supabase.co
- **Anon Key**: Already configured in `.env.development.local`
- **Service Role Key**: Already configured in `.env.development.local`

## Testing Connection

After running the SQL setup:

```bash
npm run test:db
```

Or run our simple test script:

```bash
node setup-db-simple.js
```

## Troubleshooting

If you get an error in the SQL Editor:
1. Check that all SQL statements end with a semicolon (;)
2. Try running statements one at a time if the full batch fails
3. Check the Supabase logs for more details

## Environment Variables

Your `.env.development.local` file already contains:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY

These are automatically loaded when you run `npm run dev`
