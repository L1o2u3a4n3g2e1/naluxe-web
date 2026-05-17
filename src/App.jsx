import React from "react";
import { Routes, Route, Link } from "react-router-dom";

import Auth from "./pages/Auth.jsx";
import Admin from "./pages/Admin.jsx";
import { useAuth } from "./lib/auth.jsx";
import { supabase } from "./lib/supabase.js";
import { isAdmin } from "./lib/admin.js";

function Header() {
  const { user } = useAuth();
  const [admin, setAdmin] = React.useState(false);

  React.useEffect(() => {
    let alive = true;

    async function check() {
      if (!user) {
        if (alive) setAdmin(false);
        return;
      }
      const ok = await isAdmin();
      if (alive) setAdmin(ok);
    }

    check();
    return () => {
      alive = false;
    };
  }, [user]);

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-black/10">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link to="/" className="tracking-[0.35em] font-serif text-xl text-black">
          NALUXE
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/shop" className="text-sm tracking-widest uppercase hover:text-black/80">
            Shop
          </Link>

          {admin && (
            <Link
              to="/admin"
              className="text-sm tracking-widest uppercase border border-black/20 px-4 py-2 rounded-full hover:border-black/40"
            >
              Admin
            </Link>
          )}

          {user ? (
            <button
              onClick={logout}
              className="text-sm tracking-widest uppercase border border-black/20 px-4 py-2 rounded-full hover:border-black/40"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/auth"
              className="text-sm tracking-widest uppercase border border-black/20 px-4 py-2 rounded-full hover:border-black/40"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-14">
      <div className="rounded-3xl border border-black/10 p-10">
        <div className="text-xs uppercase tracking-[0.35em] text-black/60">NALUXE</div>
        <h1 className="mt-3 font-serif text-4xl">Home</h1>
        <p className="mt-4 text-black/70">Browse products like Shein. Login only when needed.</p>
        <div className="mt-6">
          <Link to="/shop" className="rounded-full px-6 py-3 text-sm tracking-widest uppercase bg-black text-white">
            Go to shop
          </Link>
        </div>
      </div>
    </main>
  );
}

function Shop() {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-14">
      <h1 className="font-serif text-4xl">Shop</h1>
      <p className="mt-3 text-black/70">Next step: connect shop list + wishlist/cart.</p>
    </main>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}
