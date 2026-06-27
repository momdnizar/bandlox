# Bandlox - E-commerce Store Spec

## Overview
Bandlox is a minimal men's accessories brand (rings, chains, bracelets, pendants).
Style: minimal, dark/premium aesthetic, mobile-first.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth) for data and authentication
- Cloudinary for product image hosting
- Razorpay for payments (added later)
- Hosted on Vercel

## Pages
- `/` - Home: hero banner, featured products, brand blurb
- `/collections/[slug]` - Collection page: product grid, filter sidebar (price, availability), sort dropdown
- `/products/[slug]` - Product detail: image gallery, variant selector, price (with sale), add to cart, description
- `/cart` - Cart page + slide-out cart drawer accessible from header
- `/checkout` - Checkout flow (Razorpay)
- `/account` - Login/signup, order history (Supabase Auth)
- `/pages/[slug]` - Static pages (About, Contact, Policies)
- `/admin` - Protected admin panel to add/edit products (later phase)

## Core Components
- Header: logo, nav links, search, cart icon with count, announcement bar
- ProductCard: image (hover swap), title, price + strikethrough MRP, sale badge
- FilterSidebar: price range slider, availability checkboxes
- SortDropdown: featured, price low-high, high-low, newest
- CartDrawer: slide-out, line items, quantity controls, subtotal, checkout CTA
- Footer: brand blurb, quick links, payment icons

## State Management
- Cart state: Zustand store, persisted to localStorage
- On login, sync local cart to Supabase `cart_items` table

## Build Order
1. Database schema + Supabase client setup
2. Header + Footer (layout)
3. Home page
4. Collection page (grid + filters + sort)
5. Product detail page
6. Cart drawer + cart page
7. Auth (Supabase)
8. Checkout (Razorpay)
9. Admin panel