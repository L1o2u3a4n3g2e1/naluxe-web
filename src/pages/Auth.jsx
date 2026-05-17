import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || "/";

  const [mode, setMode] = React.useState("login"); // login | signup
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          console.error("SIGNUP ERROR:", error);
          setMsg(error.message);
          return;
        }

        setMsg("Signup successful ✅ If email confirmation is ON, check your inbox then login.");
        setMode("login");
        return;
      }

      // login
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("LOGIN ERROR:", error);
        setMsg(error.message);
        return;
      }

      // success
      navigate(returnTo, { replace: true });
    } catch (err) {
      console.error(err);
      setMsg(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 pt-14 pb-20">
      <div className="rounded-3xl border border-black/10 p-8 bg-white">
        <div className="text-xs uppercase tracking-[0.35em] text-black/60">NALUXE</div>
        <h1 className="mt-3 font-serif text-3xl">
          {mode === "login" ? "Login" : "Create account"}
        </h1>

        <p className="mt-2 text-sm text-black/60">
          {mode === "login"
            ? "Login to access wishlist, cart and admin (if allowed)."
            : "Create an account to save wishlist and cart."}
        </p>

        {msg && (
          <div className="mt-5 rounded-2xl border border-black/10 p-4 text-sm text-black/70">
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div>
            <label className="text-xs tracking-widest uppercase text-black/60">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-2 w-full rounded-2xl border border-black/20 px-4 py-3 outline-none focus:border-black/40"
              placeholder="nalboutique301@gmail.com"
              required
            />
          </div>

          <div>
            <label className="text-xs tracking-widest uppercase text-black/60">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-2 w-full rounded-2xl border border-black/20 px-4 py-3 outline-none focus:border-black/40"
              placeholder="Use a strong password"
              required
            />
          </div>

          <button
            disabled={loading}
            className="mt-2 w-full rounded-full px-6 py-3 text-sm tracking-widest uppercase bg-black text-white disabled:opacity-40"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
          </button>
        </form>

        <div className="mt-6 text-sm text-black/70">
          {mode === "login" ? (
            <>
              Don’t have an account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="underline underline-offset-4"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("login")}
                className="underline underline-offset-4"
              >
                Login
              </button>
            </>
          )}
        </div>

        <div className="mt-6">
          <Link to="/" className="text-xs tracking-widest uppercase text-black/60 hover:text-black">
            ← Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
