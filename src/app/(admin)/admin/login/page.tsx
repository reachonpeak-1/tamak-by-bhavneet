"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getClientAuth } from "@/lib/firebase/client";

export default function AdminLogin() {
  const { signInEmail, signInGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function establishSession() {
    const user = getClientAuth().currentUser;
    if (!user) throw new Error("Sign-in failed");
    const idToken = await user.getIdToken(true); // force refresh → carries admin claim
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "This account is not an admin");
    }
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next && next.startsWith("/admin") ? next : "/admin");
  }

  async function run(fn: () => Promise<void>) {
    setErr(null);
    setBusy(true);
    try {
      await fn();
      await establishSession();
    } catch (e) {
      setErr((e as Error).message || "Could not sign in");
      await fetch("/api/admin/session", { method: "DELETE" }).catch(() => {});
      setBusy(false);
    }
  }

  return (
    <div className="adm-login">
      <div className="adm-login__image-container">
        <img src="/admin_login_bg.png" alt="Tamak Heritage Wear" className="adm-login__image" />
        <div className="adm-login__image-overlay" />
        
        {/* Left Side Content Overlay */}
        <div className="adm-login__left-content">
          <div className="adm-login__hero-text">
            <h2>Crafted by hand,<br />worn with heritage.</h2>
            
            {/* Gold Ornament Divider */}
            <svg className="adm-login__ornament" viewBox="0 0 120 12" fill="none">
              <path d="M0 6h45M75 6h45M54 6l6-5 6 5-6 5-6-5z" stroke="#d3b67c" strokeWidth="1" />
              <circle cx="60" cy="6" r="1.5" fill="#d3b67c" />
            </svg>
            
            <p>Timeless designs rooted in tradition,<br />created for generations.</p>
          </div>
          
          {/* Stats Bar */}
          <div className="adm-login__stats">
            <div className="adm-login__stat-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8h12l-1 12H7L6 8z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
              <h3>5000+</h3>
              <span>Orders</span>
            </div>
            
            <div className="adm-login__stat-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0 4-4zm0 20a4 4 0 0 0 4-4 4 4 0 0 0-4 4zM2 12a4 4 0 0 0 4 4 4 4 0 0 0-4-4zm20 0a4 4 0 0 0-4-4 4 4 0 0 0 4 4z" />
              </svg>
              <h3>50+</h3>
              <span>Collections</span>
            </div>
            
            <div className="adm-login__stat-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" strokeDasharray="2 2" opacity="0.3" />
                <path d="M12 6c0 6 3 9 7 10-4-1-6-4-7-10zm0 0c0 6-3 9-7 10 4-1 6-4 7-10z" />
                <path d="M12 12c-2 2-3 5-3 8 0-3 1-6 3-8zm0 0c2 2 3 5 3 8 0-3-1-6-3-8z" />
              </svg>
              <h3>100%</h3>
              <span>Handcrafted</span>
            </div>
          </div>
          
          {/* Translucent Security Badge */}
          <div className="adm-login__secure-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 11l2 2 4-4" />
            </svg>
            <div className="adm-login__secure-text">
              <h4>Secure Access</h4>
              <p>Only authorized staff can access this portal</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="adm-login__form-container">
        <div className="adm-login__card">
          <div className="adm-login__brand">
            <img src="/brand/logo.png" alt="तमक" className="adm-login__logo" />
            <h2 className="adm-login__title deva">तमक</h2>
            <span className="adm-login__subtitle">Administrator Portal</span>
            
            {/* Small Divider Ornament */}
            <svg className="adm-login__brand-ornament" viewBox="0 0 100 10" fill="none">
              <path d="M0 5h35M65 5h35M44 5l6-4 6 4-6 4-6-4z" stroke="#a9823a" strokeWidth="0.8" />
              <circle cx="50" cy="5" r="1.2" fill="#a9823a" />
            </svg>
          </div>
          
          <h1 className="adm-login__card-title">Welcome Back</h1>
          <p className="adm-login__card-subtitle">Manage collections, inventory and orders.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() => signInEmail(email, pw));
            }}
          >
            <div className="adm-field">
              <span>Email</span>
              <div className="adm-in-wrapper">
                <svg className="adm-in-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  className="adm-in"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            
            <div className="adm-field">
              <span>Password</span>
              <div className="adm-in-wrapper">
                <svg className="adm-in-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  className="adm-in"
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: "2.8rem" }}
                />
                <button
                  type="button"
                  className="adm-pw-toggle"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Remember Me & Forgot Password Row */}
            <div className="adm-login__options-row">
              <label className="adm-login__checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="adm-login__forgot-link" onClick={(e) => { e.preventDefault(); alert("Please contact the main administrator to reset your credentials."); }}>
                Forgot password?
              </a>
            </div>
            
            {err && <p className="adm-error">{err}</p>}
            
            <button className="adm-btn adm-btn--solid adm-btn--block adm-login__submit-btn" disabled={busy}>
              <span>SIGN IN</span>
              <svg className="adm-login__arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12,5 19,12 12,19" />
              </svg>
            </button>
          </form>

          <div className="adm-login__or"><span>or</span></div>
          
          <button
            className="adm-btn adm-btn--ghost adm-btn--block adm-login__google-btn"
            disabled={busy}
            onClick={() => run(() => signInGoogle())}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>CONTINUE WITH GOOGLE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
