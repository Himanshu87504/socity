// InvoiceFetchDebug.jsx
// Sirf invoice fetch test karne ke liye — production mein
// is file ki zaroorat nahi, bas AppContext.jsx use karo.
//
// USAGE: Kisi bhi page mein temporarily render karo:
//   import InvoiceFetchDebug from './InvoiceFetchDebug';
//   <InvoiceFetchDebug />
// ============================================================

import React, { useState } from "react";

const BASE_URL = process.env.REACT_APP_BASE_URL;

// Token exactly waise hi read karo jaise axiosInstance karta hai
function getToken() {
  // 1. Cookie se (axiosInstance ka getToken logic)
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  if (match) return decodeURIComponent(match[1]);
  // 2. localStorage fallbacks
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("admin_access_token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

function getSid() {
  return (
    localStorage.getItem("society_identifier") ||
    localStorage.getItem("societyId") ||
    ""
  );
}

export default function InvoiceFetchDebug() {
  const [sid,      setSid]      = useState(getSid());
  const [token,    setToken]    = useState(getToken());
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [rawResp,  setRawResp]  = useState(null);

  const doFetch = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    setRawResp(null);

    const url = `${BASE_URL}/payment/invoice/all?society_identifier=${sid}`;
    console.log("[InvoiceFetchDebug] POST", url);
    console.log("[InvoiceFetchDebug] Token:", token ? token.slice(0, 40) + "..." : "EMPTY");

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Try both — backend might want just the token or Bearer prefix
          ...(token
            ? {
                Authorization: token.startsWith("Bearer ")
                  ? token
                  : `Bearer ${token}`,
              }
            : {}),
        },
        body: JSON.stringify({}),
      });

      const text = await res.text();
      setRawResp({ status: res.status, statusText: res.statusText, body: text });
      console.log("[InvoiceFetchDebug] Response:", res.status, text.slice(0, 300));

      if (!res.ok) {
        setError(`HTTP ${res.status} — ${text.slice(0, 200)}`);
        return;
      }

      let json;
      try { json = JSON.parse(text); } catch { setError("Response not JSON: " + text.slice(0, 200)); return; }

      // Extract array from various response shapes
      const arr =
        Array.isArray(json)          ? json :
        Array.isArray(json?.data)    ? json.data :
        Array.isArray(json?.data?.data) ? json.data.data :
        Array.isArray(json?.results) ? json.results :
        Array.isArray(json?.items)   ? json.items :
        Array.isArray(json?.invoices)? json.invoices :
        // Try first array value in object
        Object.values(json || {}).find(v => Array.isArray(v)) || [];

      setResult({ total: arr.length, first3: arr.slice(0, 3), keys: arr[0] ? Object.keys(arr[0]) : [] });
    } catch (err) {
      setError(err.message);
      console.error("[InvoiceFetchDebug]", err);
    } finally {
      setLoading(false);
    }
  };

  const box = { fontFamily: "monospace", fontSize: 12, background: "#1a1a2e", color: "#e0e0e0", padding: 12, borderRadius: 8, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" };

  return (
    <div style={{ padding: 20, background: "#0d0d1a", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <h2 style={{ color: "#00d4aa", marginBottom: 16 }}>🔍 Invoice Fetch Debug</h2>

      {/* Society ID */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ color: "#aaa", fontSize: 12, display: "block", marginBottom: 4 }}>
          society_identifier (localStorage se auto-fill):
        </label>
        <input
          value={sid}
          onChange={e => setSid(e.target.value)}
          placeholder="e.g. syc571c0"
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #333", background: "#111", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
        />
        {!sid && <p style={{ color: "#ff6b6b", fontSize: 11, marginTop: 4 }}>⚠️ society_identifier empty hai — localStorage mein set nahi hua?</p>}
      </div>

      {/* Token */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ color: "#aaa", fontSize: 12, display: "block", marginBottom: 4 }}>
          Token (cookie/localStorage se auto-fill):
        </label>
        <input
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Bearer eyJ..."
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #333", background: "#111", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
        />
        {!token && <p style={{ color: "#ff6b6b", fontSize: 11, marginTop: 4 }}>⚠️ Token empty hai — login check karo</p>}
      </div>

      {/* URL preview */}
      <div style={{ ...box, marginBottom: 12, background: "#111" }}>
        POST {BASE}/payment/invoice/all?society_identifier={sid || "<EMPTY>"}
      </div>

      {/* Fetch button */}
      <button
        onClick={doFetch}
        disabled={loading}
        style={{ background: loading ? "#333" : "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 9, padding: "10px 28px", color: "#000", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", marginBottom: 16 }}
      >
        {loading ? "Fetching…" : "Fetch Invoices"}
      </button>

      {/* Raw response */}
      {rawResp && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: rawResp.status === 200 ? "#00d4aa" : "#ff6b6b", fontWeight: 700, marginBottom: 6 }}>
            HTTP {rawResp.status} {rawResp.statusText}
          </p>
          <div style={box}>{rawResp.body.slice(0, 1000)}</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid #ff6b6b", borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <p style={{ color: "#ff6b6b", fontWeight: 700, marginBottom: 4 }}>❌ Error</p>
          <div style={box}>{error}</div>
        </div>
      )}

      {/* Success */}
      {result && (
        <div style={{ background: "rgba(0,212,170,0.07)", border: "1px solid #00d4aa", borderRadius: 8, padding: 12 }}>
          <p style={{ color: "#00d4aa", fontWeight: 700, marginBottom: 8 }}>
            ✅ Success — {result.total} invoices mili
          </p>
          <p style={{ color: "#aaa", fontSize: 12, marginBottom: 6 }}>
            Backend field names: <span style={{ color: "#ffb347" }}>{result.keys.join(", ")}</span>
          </p>
          <p style={{ color: "#aaa", fontSize: 12, marginBottom: 4 }}>First 3 records:</p>
          <div style={box}>{JSON.stringify(result.first3, null, 2)}</div>
        </div>
      )}
    </div>
  );
}