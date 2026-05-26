// Shared UI bits — logo, header, nav, sticker card, doodles, buttons, etc.

const { useState, useEffect, useRef, useMemo } = React;

// ---------- DOODLE BACKGROUND ----------
function DoodleLayer() {
  // Hand-drawn-ish scattered shapes. Positions are stable per mount.
  const doodles = useMemo(() => ([
    { top: "6%",  left: "4%",  rot: -12, type: "star",   color: "#ff4d8d", size: 38 },
    { top: "14%", left: "92%", rot: 18,  type: "squig",  color: "#4ec3ff", size: 60 },
    { top: "26%", left: "2%",  rot: 8,   type: "dot",    color: "#ffd23f", size: 28 },
    { top: "42%", left: "96%", rot: -8,  type: "star",   color: "#8b5cf6", size: 28 },
    { top: "55%", left: "3%",  rot: -22, type: "squig",  color: "#6ddc8a", size: 70 },
    { top: "70%", left: "94%", rot: 10,  type: "dot",    color: "#ff8a3d", size: 36 },
    { top: "82%", left: "8%",  rot: 6,   type: "star",   color: "#4ec3ff", size: 42 },
    { top: "90%", left: "88%", rot: -14, type: "squig",  color: "#ff4d8d", size: 56 },
    { top: "34%", left: "50%", rot: 14,  type: "dot",    color: "#ffd23f", size: 18 },
    { top: "62%", left: "48%", rot: -18, type: "star",   color: "#6ddc8a", size: 22 },
  ]), []);
  return (
    <div className="doodle-layer" aria-hidden>
      {doodles.map((d, i) => (
        <div key={i} className="doodle"
             style={{ top: d.top, left: d.left, transform: `rotate(${d.rot}deg)`,
                      animation: `bob 6s ease-in-out ${i*0.4}s infinite` }}>
          {d.type === "star" && (
            <svg width={d.size} height={d.size} viewBox="0 0 24 24" fill="none" stroke={d.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4 18.4 5.6" />
            </svg>
          )}
          {d.type === "squig" && (
            <svg width={d.size} height={d.size/2} viewBox="0 0 60 30" fill="none" stroke={d.color} strokeWidth="3.4" strokeLinecap="round">
              <path d="M2 18 Q 10 2, 18 18 T 34 18 T 58 18" />
            </svg>
          )}
          {d.type === "dot" && (
            <svg width={d.size} height={d.size} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="6" fill={d.color} />
              <circle cx="12" cy="12" r="11" fill="none" stroke={d.color} strokeWidth="1.5" strokeDasharray="2 3"/>
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------- LOGO ----------
function Logo({ size = 48, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      background: "transparent", border: "none", cursor: "pointer", padding: 0,
    }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "var(--blue)", border: `4px solid white`,
        boxShadow: "0 4px 0 rgba(0,0,0,0.12)",
        display: "grid", placeItems: "center",
        transform: "rotate(-8deg)",
      }}>
        <span style={{ fontFamily: "'Bagel Fat One', cursive", color: "white", fontSize: size * 0.55, lineHeight: 1 }}>
          S!
        </span>
      </div>
      <div style={{ textAlign: "left", lineHeight: 1 }}>
        <div style={{ fontFamily: "'Bagel Fat One', cursive", fontSize: size * 0.62, color: "var(--ink)", letterSpacing: -0.5 }}>
          Sticker Stop
        </div>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: size * 0.36, color: "var(--ink)", opacity: 0.75, marginTop: 2 }}>
          stick 'em everywhere ✨
        </div>
      </div>
    </button>
  );
}

// ---------- HEADER ----------
function Header({ page, setPage, cartCount }) {
  return (
    <header style={{
      position: "relative", zIndex: 5,
      maxWidth: 1180, margin: "0 auto", padding: "28px 32px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
    }}>
      <Logo size={56} onClick={() => setPage({ name: "list" })} />
      <nav style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setPage({ name: "list" })} style={navBtnStyle(page.name === "list")}>
          All Stickers
        </button>
        <button onClick={() => setPage({ name: "cart" })} style={{
          ...navBtnStyle(page.name === "cart"),
          background: "var(--yellow)", color: "var(--ink)",
          position: "relative", paddingRight: cartCount > 0 ? 56 : 20,
        }}>
          <CartIcon /> Cart
          {cartCount > 0 && (
            <span style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "var(--ink)", color: "white",
              minWidth: 26, height: 26, borderRadius: 13, padding: "0 8px",
              display: "grid", placeItems: "center",
              fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 14,
            }}>{cartCount}</span>
          )}
        </button>
      </nav>
    </header>
  );
}

function navBtnStyle(active) {
  return {
    fontFamily: "'Fredoka'",
    fontWeight: 600,
    fontSize: 17,
    padding: "10px 18px",
    borderRadius: 999,
    border: "3px solid var(--ink)",
    background: active ? "var(--ink)" : "white",
    color: active ? "white" : "var(--ink)",
    cursor: "pointer",
    boxShadow: "0 4px 0 rgba(42,34,56,0.85)",
    transform: "translateY(0)",
    transition: "transform .1s, box-shadow .1s",
    display: "inline-flex", alignItems: "center", gap: 8,
  };
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h3l3 13h12l2-9H6" />
    </svg>
  );
}

// ---------- CHUNKY BUTTON ----------
function BigButton({ children, onClick, color = "var(--pink)", disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 19,
      padding: "14px 28px", borderRadius: 999,
      border: "3px solid var(--ink)",
      background: disabled ? "#d8d2c4" : color,
      color: "white",
      cursor: disabled ? "not-allowed" : "pointer",
      boxShadow: "0 6px 0 rgba(42,34,56,0.85)",
      transition: "transform .08s, box-shadow .08s",
      letterSpacing: 0.2,
      ...style,
    }}
    onMouseDown={(e) => { if (disabled) return; e.currentTarget.style.transform = "translateY(4px)"; e.currentTarget.style.boxShadow = "0 2px 0 rgba(42,34,56,0.85)"; }}
    onMouseUp={(e) => { if (disabled) return; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 6px 0 rgba(42,34,56,0.85)"; }}
    onMouseLeave={(e) => { if (disabled) return; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 6px 0 rgba(42,34,56,0.85)"; }}
    >
      {children}
    </button>
  );
}

// ---------- PRICE TAG ----------
function PriceTag({ amount, color = "var(--yellow)", rot = -6, size = "md" }) {
  const dims = size === "lg"
    ? { fs: 30, pad: "8px 18px 8px 26px", hole: 10 }
    : { fs: 20, pad: "6px 14px 6px 20px", hole: 7 };
  return (
    <div style={{
      position: "relative",
      display: "inline-flex", alignItems: "center",
      background: color, color: "var(--ink)",
      border: "3px solid var(--ink)",
      borderRadius: "8px 28px 28px 8px",
      padding: dims.pad,
      fontFamily: "'Bagel Fat One', cursive",
      fontSize: dims.fs, lineHeight: 1,
      transform: `rotate(${rot}deg)`,
      boxShadow: "0 4px 0 rgba(42,34,56,0.85)",
    }}>
      <span style={{
        position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
        width: dims.hole*2, height: dims.hole*2, borderRadius: "50%",
        background: "var(--paper)", border: "2px solid var(--ink)",
      }} />
      <span style={{ marginLeft: dims.hole + 4 }}>${amount}</span>
    </div>
  );
}

// ---------- STICKER CARD (for listing) ----------
function SetCard({ set, rot, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="sticker"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: "pointer",
        transform: `rotate(${hover ? 0 : rot}deg) translateY(${hover ? -8 : 0}px)`,
        background: "white",
        padding: 18,
        position: "relative",
      }}>
      {/* Washi tape */}
      <div style={{
        position: "absolute", top: -10, left: "50%", transform: "translateX(-50%) rotate(-3deg)",
        width: 90, height: 22,
        background: `repeating-linear-gradient(45deg, ${set.color}, ${set.color} 8px, white 8px, white 16px)`,
        opacity: 0.85,
        borderRadius: 2,
        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
      }} />
      <div style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        background: "var(--paper-2)",
        aspectRatio: "4 / 3",
      }}>
        <img src={set.image} alt={set.name} style={{
          width: "100%", height: "100%", objectFit: "cover",
          display: "block",
        }} />
        {/* Price corner */}
        <div style={{ position: "absolute", top: 10, right: -6 }}>
          <PriceTag amount={`${PRICE_PAIR} pair`} color="var(--yellow)" rot={8} />
        </div>
        <div style={{ position: "absolute", top: 54, right: -6 }}>
          <PriceTag amount={`${PRICE_SHEET} sheet`} color="white" rot={-4} />
        </div>
      </div>
      <div style={{ padding: "14px 4px 4px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <h3 style={{
            fontFamily: "'Bagel Fat One', cursive", margin: 0,
            fontSize: 26, lineHeight: 1, letterSpacing: -0.3,
          }}>{set.name}</h3>
          <span style={{
            background: set.color, color: "var(--ink)",
            fontFamily: "'Fredoka'", fontWeight: 600, fontSize: 12,
            padding: "3px 8px", borderRadius: 999,
            border: "2px solid var(--ink)",
            transform: "translateY(-2px)",
          }}>2 sheets</span>
        </div>
        <p style={{
          margin: "6px 0 12px", fontSize: 15, lineHeight: 1.35,
          color: "var(--ink)", opacity: 0.8,
        }}>{set.tagline}</p>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontFamily: "'Fredoka'", fontWeight: 600,
        }}>
          <span style={{ color: "var(--ink)", opacity: 0.7, fontSize: 14 }}>
            Pair deal · save $1
          </span>
          <span style={{
            background: "var(--ink)", color: "white",
            borderRadius: 999, padding: "8px 14px", fontSize: 14,
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            See sheets <span style={{ fontSize: 18, lineHeight: 1 }}>→</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------- SHEET CHOICE (on detail page) ----------
function SheetChoice({ image, side, label, blurb, highlights, selected, onSelect, color }) {
  // side: "left" or "right" — used to crop the appropriate half from the pair image
  return (
    <div
      className="sticker"
      onClick={onSelect}
      style={{
        cursor: "pointer", padding: 14,
        background: "white",
        borderRadius: 18,
        outline: selected ? `4px solid ${color}` : "4px solid transparent",
        outlineOffset: -2,
        transform: selected ? "translateY(-4px)" : "translateY(0)",
        transition: "all .2s",
        position: "relative",
      }}>
      {selected && (
        <div style={{
          position: "absolute", top: -14, right: -14,
          background: color, color: "white",
          border: "3px solid var(--ink)",
          borderRadius: "50%", width: 44, height: 44,
          display: "grid", placeItems: "center",
          boxShadow: "0 4px 0 rgba(42,34,56,0.85)",
          transform: "rotate(8deg)",
          animation: "pop .3s",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>
      )}
      <div style={{
        position: "relative",
        borderRadius: 12, overflow: "hidden",
        background: "var(--paper-2)",
        aspectRatio: "3 / 4",
      }}>
        <img src={image} alt={label} style={{
          position: "absolute", top: 0,
          left: side === "left" ? 0 : "-100%",
          width: "200%", height: "100%",
          objectFit: "cover",
          display: "block",
        }} />
      </div>
      <div style={{ padding: "12px 4px 4px" }}>
        <div style={{
          fontFamily: "'Bagel Fat One', cursive", fontSize: 20, lineHeight: 1.05, marginBottom: 6,
        }}>{label}</div>
        <div style={{
          fontFamily: "'Fredoka'", fontWeight: 600, color: "var(--ink)", opacity: 0.85,
          fontSize: 14, marginBottom: 8,
        }}>${PRICE_SHEET} · one sheet</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.4, opacity: 0.75 }}>{blurb}</p>
      </div>
    </div>
  );
}

// ---------- PAIR CHOICE ----------
function PairChoice({ image, label, selected, onSelect, color }) {
  return (
    <div
      className="sticker"
      onClick={onSelect}
      style={{
        cursor: "pointer", padding: 14,
        background: "white",
        borderRadius: 18,
        outline: selected ? `4px solid ${color}` : "4px solid transparent",
        outlineOffset: -2,
        transform: selected ? "translateY(-4px)" : "translateY(0)",
        transition: "all .2s",
        position: "relative",
      }}>
      {selected && (
        <div style={{
          position: "absolute", top: -14, right: -14,
          background: color, color: "white",
          border: "3px solid var(--ink)",
          borderRadius: "50%", width: 44, height: 44,
          display: "grid", placeItems: "center",
          boxShadow: "0 4px 0 rgba(42,34,56,0.85)",
          transform: "rotate(8deg)",
          animation: "pop .3s",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>
      )}
      {/* "BEST DEAL" ribbon */}
      <div style={{
        position: "absolute", top: 16, left: -14,
        background: "var(--pink)", color: "white",
        border: "3px solid var(--ink)",
        fontFamily: "'Bagel Fat One', cursive", fontSize: 13,
        padding: "5px 12px",
        transform: "rotate(-8deg)",
        borderRadius: 6,
        boxShadow: "0 3px 0 rgba(42,34,56,0.85)",
        zIndex: 2,
      }}>BEST DEAL!</div>
      <div style={{
        position: "relative", borderRadius: 12, overflow: "hidden",
        background: "var(--paper-2)", aspectRatio: "4 / 3",
      }}>
        <img src={image} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ padding: "12px 4px 4px" }}>
        <div style={{
          fontFamily: "'Bagel Fat One', cursive", fontSize: 22, lineHeight: 1.05, marginBottom: 6,
        }}>Get the pair · both sheets</div>
        <div style={{
          fontFamily: "'Fredoka'", fontWeight: 600, color: "var(--ink)", opacity: 0.85,
          fontSize: 14, marginBottom: 8,
        }}>
          <span style={{ textDecoration: "line-through", opacity: 0.5, marginRight: 8 }}>${PRICE_SHEET * 2}</span>
          ${PRICE_PAIR} · saves you $1
        </div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.4, opacity: 0.75 }}>
          Why pick? Stick 'em all. Both sheets for less than buying separately.
        </p>
      </div>
    </div>
  );
}

// ---------- CONFETTI (order success) ----------
function Confetti({ active }) {
  const pieces = useMemo(() => Array.from({ length: 50 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2 + Math.random() * 1.6,
    color: ["#ff4d8d", "#ffd23f", "#4ec3ff", "#6ddc8a", "#ff8a3d", "#8b5cf6"][i % 6],
    rot: Math.random() * 360,
    shape: i % 3,
    size: 8 + Math.random() * 8,
  })), []);
  if (!active) return null;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 100 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          top: 0, left: `${p.left}%`,
          width: p.size, height: p.size,
          background: p.shape !== 2 ? p.color : "transparent",
          border: p.shape === 2 ? `3px solid ${p.color}` : "none",
          borderRadius: p.shape === 1 ? "50%" : 4,
          transform: `rotate(${p.rot}deg)`,
          animation: `confetti-fall ${p.duration}s ${p.delay}s linear forwards`,
        }} />
      ))}
    </div>
  );
}

// ---------- QUANTITY STEPPER ----------
function Stepper({ value, onChange, min = 1, max = 99 }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      border: "3px solid var(--ink)", borderRadius: 999,
      background: "white", overflow: "hidden",
      boxShadow: "0 3px 0 rgba(42,34,56,0.85)",
    }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={stepBtn}>−</button>
      <span style={{
        fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 18,
        minWidth: 32, textAlign: "center",
      }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} style={stepBtn}>+</button>
    </div>
  );
}
const stepBtn = {
  fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 22,
  width: 38, height: 38, border: "none", background: "transparent",
  cursor: "pointer", color: "var(--ink)",
};

// ---------- EXPORT ----------
Object.assign(window, {
  DoodleLayer, Logo, Header, CartIcon, BigButton, PriceTag,
  SetCard, SheetChoice, PairChoice, Confetti, Stepper,
});
