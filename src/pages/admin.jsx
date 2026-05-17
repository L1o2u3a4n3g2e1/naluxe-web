import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { uploadManyProductImages } from "../lib/storage.js";

function formatRWF(amount) {
  const n = Number(amount || 0);
  return `${n.toLocaleString("en-US")} RWF`;
}

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [products, setProducts] = useState([]);

  // Form fields
  const [name, setName] = useState("");
  const [priceRwf, setPriceRwf] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Clothing");
  const [subcategory, setSubcategory] = useState("");
  const [active, setActive] = useState(true);
  const [images, setImages] = useState(null); // FileList

  const canSave = useMemo(() => {
    return name.trim().length > 0 && String(priceRwf).trim().length > 0;
  }, [name, priceRwf]);

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,price_rwf,category,subcategory,image_url,active,created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (e) {
      setError(e?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function addProduct(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setOk("");

    try {
      // 1) Create product first (no image yet)
      const { data: created, error: insertError } = await supabase
        .from("products")
        .insert([
          {
            name: name.trim(),
            description: description.trim() || null,
            price_rwf: Number(priceRwf),
            category: category.trim(),
            subcategory: subcategory.trim() || null,
            active,
          },
        ])
        .select("id")
        .single();

      if (insertError) throw insertError;

      const productId = created.id;

      // 2) Upload up to 4 images (angles)
      const fileList = images ? Array.from(images).slice(0, 4) : [];
      let urls = [];
      if (fileList.length) {
        urls = await uploadManyProductImages(fileList, 4);
      }

      // 3) Save image rows into product_images
      if (urls.length) {
        const rows = urls.map((url, i) => ({
          product_id: productId,
          image_url: url,
          sort_order: i + 1,
        }));

        const { error: imgErr } = await supabase.from("product_images").insert(rows);
        if (imgErr) throw imgErr;

        // 4) Save first image into products.image_url (grid cover)
        const { error: coverErr } = await supabase
          .from("products")
          .update({ image_url: urls[0] })
          .eq("id", productId);

        if (coverErr) throw coverErr;
      }

      setOk("Product added successfully ✅");

      // Reset form
      setName("");
      setPriceRwf("");
      setDescription("");
      setCategory("Clothing");
      setSubcategory("");
      setActive(true);
      setImages(null);

      // Reload list
      await loadProducts();
    } catch (e2) {
      setError(e2?.message || "Failed to add product");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p) {
    setError("");
    try {
      const { error } = await supabase
        .from("products")
        .update({ active: !p.active })
        .eq("id", p.id);

      if (error) throw error;
      await loadProducts();
    } catch (e) {
      setError(e?.message || "Failed to update product");
    }
  }

  async function deleteProduct(p) {
    if (!confirm(`Delete "${p.name}"?`)) return;

    setError("");
    try {
      // product_images has ON DELETE CASCADE, so it will delete images rows too
      const { error } = await supabase.from("products").delete().eq("id", p.id);
      if (error) throw error;

      await loadProducts();
    } catch (e) {
      setError(e?.message || "Failed to delete product");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 pb-20">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-black/60">Admin</div>
          <h1 className="mt-2 font-serif text-4xl">Dashboard</h1>
        </div>

        <button
          onClick={loadProducts}
          className="rounded-full px-5 py-2 text-sm tracking-widest uppercase border border-black/20 hover:border-black/40"
        >
          Refresh
        </button>
      </div>

      {(error || ok) && (
        <div className="mt-6 rounded-3xl border border-black/10 p-6">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {ok && <p className="text-green-700 text-sm">{ok}</p>}
        </div>
      )}

      {/* Add Product Form */}
      <section className="mt-8 rounded-3xl border border-black/10 p-6 md:p-8">
        <div className="text-xs uppercase tracking-[0.35em] text-black/60">Add Product</div>

        <form onSubmit={addProduct} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs tracking-widest uppercase text-black/60">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/20 px-4 py-3 outline-none focus:border-black/40"
              placeholder="e.g. Classic Black Dress"
              required
            />
          </div>

          <div>
            <label className="text-xs tracking-widest uppercase text-black/60">Price (RWF) *</label>
            <input
              value={priceRwf}
              onChange={(e) => setPriceRwf(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/20 px-4 py-3 outline-none focus:border-black/40"
              placeholder="e.g. 45000"
              inputMode="numeric"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs tracking-widest uppercase text-black/60">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/20 px-4 py-3 outline-none focus:border-black/40"
              rows={3}
              placeholder="Short description..."
            />
          </div>

          <div>
            <label className="text-xs tracking-widest uppercase text-black/60">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/20 px-4 py-3 outline-none focus:border-black/40"
              placeholder="Clothing / Jewelry / Bags / Tech Accessories"
            />
          </div>

          <div>
            <label className="text-xs tracking-widest uppercase text-black/60">Subcategory</label>
            <input
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/20 px-4 py-3 outline-none focus:border-black/40"
              placeholder="Women / Men / Couple / Shoes..."
            />
          </div>

          <div>
            <label className="text-xs tracking-widest uppercase text-black/60">Images (1–4 angles)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImages(e.target.files || null)}
              className="mt-2 w-full rounded-2xl border border-black/20 px-4 py-3"
            />
            <p className="mt-2 text-xs text-black/50">
              Upload up to 4 photos (front, side, back, detail).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs tracking-widest uppercase text-black/60">Active</label>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-5 w-5"
            />
          </div>

          <div className="md:col-span-2">
            <button
              disabled={!canSave || saving}
              className="w-full rounded-full px-6 py-3 text-sm tracking-widest uppercase bg-black text-white disabled:opacity-40"
            >
              {saving ? "Saving..." : "Add Product"}
            </button>
          </div>
        </form>
      </section>

      {/* Product List */}
      <section className="mt-10">
        <div className="text-xs uppercase tracking-[0.35em] text-black/60">Products</div>

        {loading ? (
          <p className="mt-6 text-black/70">Loading...</p>
        ) : products.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-black/10 p-10">
            <p className="text-black/70">No products yet.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="rounded-3xl border border-black/10 overflow-hidden bg-white">
                <div className="h-48 bg-neutral-50 border-b border-black/10">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs tracking-[0.35em] uppercase text-black/40">
                      No image
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="text-xs uppercase tracking-[0.35em] text-black/60">
                    {p.category}
                    {p.subcategory ? ` • ${p.subcategory}` : ""}
                  </div>
                  <div className="mt-2 font-serif text-lg">{p.name}</div>
                  <div className="mt-2 text-sm text-black/80">{formatRWF(p.price_rwf)}</div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleActive(p)}
                      className="text-xs tracking-widest uppercase border border-black/20 px-4 py-2 rounded-full hover:border-black/40"
                    >
                      {p.active ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() => deleteProduct(p)}
                      className="text-xs tracking-widest uppercase border border-black/20 px-4 py-2 rounded-full hover:border-black/40"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-black/50">
                    Status: {p.active ? "Live" : "Hidden"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
