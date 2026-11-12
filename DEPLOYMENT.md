# Aura Commerce Production Deployment Guide

This document outlines the final steps to deploy Aura Commerce to Netlify and connect it to a production Supabase instance.

## 1. Production Deployment Checklist
- [ ] **Environment Variables**: All production keys configured in Netlify UI.
- [ ] **Build Command**: `npm run build` verified without errors.
- [ ] **Routing**: `netlify.toml` present with SPA redirect rules.
- [ ] **Database**: Production Supabase tables and RLS policies created.
- [ ] **Storage**: Public bucket for product images created in Supabase.
- [ ] **Auth**: Netlify URL added to Supabase "Allowed Redirect URLs".
- [ ] **SEO**: Title, Description, and OpenGraph tags verified.

## 2. Environment Variables
Add these variables in the **Netlify Dashboard** (Site Settings > Build & Deploy > Environment):

| Variable | Description | Example / Note |
|----------|-------------|----------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | (Found in API settings) |
| `VITE_SHEIN_AFFILIATE_ID` | Your SHEIN Publisher ID | `SHEIN_AFF_XXXXX` |
| `VITE_SHEIN_DEFAULT_SUBID` | Default tracking sub-ID | `aura_store_prod` |

**CRITICAL**: Never expose the `SUPABASE_SERVICE_ROLE_KEY` in these settings.

## 3. Netlify Configuration
The app includes a `netlify.toml` file. Ensure your build settings match:
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### SPA Routing
Netlify handles the `#` hash routing automatically, but the `_redirects` file in `public/` and the `netlify.toml` ensure that deep links (if switched to path routing) also work by redirecting all traffic to `index.html`.

## 4. Supabase Setup
1. **Tables**: Run the migrations or use the schema defined in `src/types/index.ts` to create `products`, `categories`, `orders`, and `affiliate_clicks`.
2. **RLS Policies**:
   - `products`: Public Read, Authenticated (Admin) Write.
   - `categories`: Public Read, Authenticated (Admin) Write.
   - `orders`: Authenticated (Admin) Read/Update, Public Insert (for checkouts).
   - `affiliate_clicks`: Public Insert, Authenticated (Admin) Read.

## 5. Custom Domain Configuration
To point a custom domain (e.g., `aura-shop.com`) to Netlify:
1. **A Record**: Point `@` to Netlify's load balancer IP (`75.101.145.87`).
2. **CNAME Record**: Point `www` to your Netlify subdomain (`your-site.netlify.app`).
3. **SSL**: Netlify will automatically provision a Let's Encrypt certificate once the domain is connected.
