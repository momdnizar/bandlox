import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface ProductImage {
  url: string;
  position: number | null;
}

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  description: string | null;
  product_images: ProductImage[] | null;
}

function getProductImageUrl(product: Product): string | null {
  if (!product.product_images || product.product_images.length === 0) {
    return null;
  }
  const sorted = [...product.product_images].sort((a, b) => {
    if (a.position === null) return 1;
    if (b.position === null) return -1;
    return a.position - b.position;
  });
  return sorted[0]?.url ?? null;
}

export default async function Home() {
  const { data: featuredProducts, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (
        url,
        position
      )
    `
    )
    .limit(4);

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-zinc-400">{error.message}</p>
        </div>
      </main>
    );
  }

  const isLoading = !featuredProducts || featuredProducts.length === 0;

  return (
    <main className="bg-black text-white">
      {/* ─────────── Section 1 — Hero ─────────── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background image with dark overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=2070&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-black/60" />

        {/* Hero content */}
        <div className="relative z-10 text-center px-6 animate-fade-in">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold uppercase tracking-[0.2em] mb-6">
            BANDLOX
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-zinc-300 tracking-wider mb-10 max-w-xl mx-auto">
            &ldquo;Premium jewelry crafted for modern icons.&rdquo;
          </p>
          <Link
            href="/collections/rings"
            className="inline-block border border-white/20 hover:border-white/60 text-white px-10 py-4 text-sm tracking-[0.15em] uppercase transition-all duration-500 hover:bg-white hover:text-black"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* ─────────── Section 2 — Featured Collection ─────────── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-[0.12em] mb-4">
            Featured Collection
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base tracking-wider">
            Handpicked pieces from our latest collection.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-lg">No products available yet.</p>
            <p className="text-zinc-600 text-sm mt-2">
              Check back soon for new arrivals.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {featuredProducts.map((product: Product) => {
                const imageUrl = getProductImageUrl(product);
                return (
                  <Link
                    key={product.id}
                    href={product.slug ? `/products/${product.slug}` : '#'}
                    className="group block bg-black border border-zinc-800 rounded-lg overflow-hidden transition-all duration-500 hover:border-zinc-600"
                  >
                    <div className="aspect-[4/5] relative overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={`${product.title?.trim() || "Bandlox product"} product image`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                          <span className="text-zinc-600 text-sm">
                            No image
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-sm sm:text-base tracking-wide mb-2">
                        {product.title?.trim() || "Bandlox product"}
                      </h3>
                      <p className="text-zinc-400 text-sm font-medium">
                        ₹{product.price}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="flex justify-center mt-16">
              <Link
                href="/collections/rings"
                className="inline-block border border-zinc-700 hover:border-zinc-400 text-white px-10 py-4 text-sm tracking-[0.15em] uppercase transition-all duration-500"
              >
                View All Rings
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ─────────── Section 3 — Brand Story ─────────── */}
      <section className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold uppercase tracking-[0.08em] leading-tight">
              Crafted
              <br />
              For Presence
            </h2>
          </div>
          <div>
            <p className="text-zinc-300 text-base sm:text-lg leading-relaxed tracking-wide">
              Bandlox creates premium jewelry designed to elevate everyday style.
              Every piece blends bold identity, modern craftsmanship, and timeless
              design, helping you stand apart without saying a word.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────── Section 4 — Luxury Stats Strip ─────────── */}
      <section className="border-t border-zinc-800 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-white text-xs uppercase tracking-[0.18em] font-semibold">
              Premium
              <br />
              Materials
            </p>
          </div>
          <div>
            <p className="text-white text-xs uppercase tracking-[0.18em] font-semibold">
              Modern
              <br />
              Design
            </p>
          </div>
          <div>
            <p className="text-white text-xs uppercase tracking-[0.18em] font-semibold">
              Worldwide
              <br />
              Shipping
            </p>
          </div>
          <div>
            <p className="text-white text-xs uppercase tracking-[0.18em] font-semibold">
              Secure
              <br />
              Checkout
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
