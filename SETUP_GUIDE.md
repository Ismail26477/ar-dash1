# Environment Setup Guide

This guide will help you set up your AR Dashboard project with Supabase.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Supabase account with a project created

## Step 1: Environment Variables

All required environment variables are automatically managed through the v0 integration system. The variables are stored in `/vercel/share/.env.project` and are automatically mirrored to `.env.local` for local development.

**If you need to manually set variables:**

Create a `.env.local` file in the project root with the following variables:

```
VITE_SUPABASE_PROJECT_ID=your-project-ref
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret
POSTGRES_URL=postgres://user:password@host:port/database
POSTGRES_URL_NON_POOLING=postgres://user:password@host:port/database
```

You can find these credentials in your Supabase project:
- Go to **Settings → API** to find the URL and keys
- Go to **Settings → Database** to find the PostgreSQL connection string

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including `pg` for database migrations.

## Step 3: Set Up Database Schema

Run the database setup script to create tables, functions, and seed initial data:

```bash
npm run setup:db
```

This script will:
1. Create all database tables and enums
2. Set up Row Level Security (RLS) policies
3. Create helper functions and triggers
4. Seed initial categories and products

**What the script creates:**

- **Tables:** profiles, addresses, categories, products, cart_items, orders, order_items, reviews, support_tickets, notifications, discounts, order_status_history
- **Functions:** Authentication helpers, order placement, stock management, status tracking
- **Triggers:** Auto-update timestamps, user profile creation, order status history
- **RLS Policies:** User-specific data access, admin overrides

## Step 4: Start Development

```bash
npm run dev
```

The application will start at `http://localhost:8080` (or another available port).

## Verification

After setup, verify your database is working by:

1. **Check database connection:**
   ```bash
   npm run setup:db
   ```
   Should show: `Found X products in database`

2. **Test in the app:**
   - Navigate to the dashboard
   - Products should load from the database
   - All CRUD operations should work

## Troubleshooting

### "Missing environment variables" error

**Solution:** Ensure all required environment variables are set in `.env.local` or through your hosting platform's environment settings.

### "Invalid API key" error

**Solution:** Check that your Supabase keys are correct:
- Go to Supabase Dashboard → Settings → API
- Verify both the URL and keys match your `.env.local`

### "Could not find table" error

**Solution:** Run the database setup script:
```bash
npm run setup:db
```

### SSL Certificate Error

The setup script automatically handles SSL with `NODE_TLS_REJECT_UNAUTHORIZED=0`. If you get SSL errors:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run setup:db
```

### Connection Refused

**Solution:** Make sure:
1. Your Supabase project is running (check Supabase Dashboard)
2. Your IP address is added to Supabase's network restrictions (if enabled)
3. Your connection string is correct

## Database Schema

The application uses the following main tables:

```
Profiles (users) ←→ Orders ←→ Order Items ←→ Products ←→ Categories
                        ↓
                  Order Status History
                        ↓
                  Shipping Address

Profiles ←→ Cart Items ←→ Products
Profiles ←→ Reviews ←→ Products
Profiles ←→ Support Tickets
```

## Next Steps

1. **Create an admin account:** Update a user's role to 'admin' in the profiles table
2. **Add products:** Use the admin dashboard to create product categories and items
3. **Configure payment:** Set up Razorpay integration for payment processing
4. **Customize branding:** Update logo, colors, and content to match your brand

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review application logs: `npm run dev` output
- Contact support through your hosting platform
