// Page components — Listing, Detail, Cart, Success.

// ---------- LIST PAGE ----------
function ListPage({ setPage, addToCart }) {
  // Subtle rotations per card to feel hand-placed
  const rots = [-2.5, 1.8, -1.4, 2.2, -2.0];
  return (
    <main style={{ position: "relative", zIndex: 2, maxWidth: 1180, margin: "0 auto", padding: "16px 32px 80px" }}>
      {/* Hero */}
      <section style={{ padding: "8px 0 36px", textAlign: "center", position: "relative" }}>
        <div style={{
          display: "inline-block",
          background: "var(--ink)", color: "white",
          fontFamily: "'Fredoka'", fontWeight: 600, fontSize: 13, letterSpacing: 1,
          padding: "6px 14px", borderRadius: 999,
          textTransform: "uppercase",
          transform: "rotate(-1.5deg)", marginBottom: 14,
        }}>Fresh batch · hand-picked sheets</div>
        <h1 style={{
          fontFamily: "'Bagel Fat One', cursive",
          fontSize: "clamp(48px, 7vw, 96px)",
          margin: "0 0 12px", lineHeight: 0.95,
          letterSpacing: -1.5,
        }}>
          <span style={{ display: "inline-block", transform: "rotate(-2deg)" }}>Stickers</span>{" "}
          <span style={{ display: "inline-block", color: "var(--pink)", transform: "rotate(2deg)" }}>that</span>{" "}
          <span style={{ display: "inline-block", transform: "rotate(-1deg)" }}>stick</span>
          <span style={{ color: "var(--blue)", display: "inline-block", transform: "rotate(3deg) translateY(6px)" }}>!</span>
        </h1>
        <p style={{
          fontFamily: "'Caveat', cursive", fontSize: 26, color: "var(--ink)",
          opacity: 0.85, margin: 0,
        }}>
          $2 a sheet · $3 for the pair · stick them on EVERYTHING
        </p>
      </section>

      {/* Set cards */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "32px 26px",
        marginTop: 12,
      }}>
        {STICKER_SETS.map((s, i) => (
          <SetCard key={s.id} set={s} rot={rots[i]} onClick={() => setPage({ name: "detail", id: s.id })} />
        ))}
      </section>

      {/* How-it-works strip */}
      <section style={{
        marginTop: 60,
        background: "white",
        border: "3px solid var(--ink)",
        borderRadius: 22,
        padding: "24px 28px",
        boxShadow: "0 8px 0 rgba(42,34,56,0.85)",
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18,
        alignItems: "center",
      }}>
        {[
          { n: 1, c: "var(--pink)", t: "Pick your sheets", s: "Browse 5 sets" },
          { n: 2, c: "var(--yellow)", t: "Add to cart", s: "Single or pair" },
          { n: 3, c: "var(--blue)", t: "Place your order", s: "No payment online" },
          { n: 4, c: "var(--mint)", t: "Stickers ship out", s: "Stick everywhere 🎉" },
        ].map((step) => (
          <div key={step.n} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: step.c, border: "3px solid var(--ink)",
              display: "grid", placeItems: "center",
              fontFamily: "'Bagel Fat One', cursive", fontSize: 22, color: "var(--ink)",
              flexShrink: 0,
            }}>{step.n}</div>
            <div>
              <div style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 16 }}>{step.t}</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>{step.s}</div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

// ---------- DETAIL PAGE ----------
function DetailPage({ id, setPage, addToCart }) {
  const set = STICKER_SETS.find((s) => s.id === id);
  const [choice, setChoice] = useState("pair"); // 'a' | 'b' | 'pair'
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!set) return <div>Not found</div>;

  const price = choice === "pair" ? PRICE_PAIR : PRICE_SHEET;
  const total = price * qty;

  const handleAdd = () => {
    let item;
    if (choice === "a") item = { kind: "sheet", setId: set.id, sheetId: set.sheetA.id, name: `${set.name} — ${set.sheetA.name}`, image: set.image, side: "left", price: PRICE_SHEET };
    else if (choice === "b") item = { kind: "sheet", setId: set.id, sheetId: set.sheetB.id, name: `${set.name} — ${set.sheetB.name}`, image: set.image, side: "right", price: PRICE_SHEET };
    else item = { kind: "pair", setId: set.id, sheetId: `${set.id}-pair`, name: `${set.name} — Both sheets`, image: set.image, side: "full", price: PRICE_PAIR };
    addToCart(item, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <main style={{ position: "relative", zIndex: 2, maxWidth: 1180, margin: "0 auto", padding: "8px 32px 80px" }}>
      {/* Breadcrumb / back */}
      <button onClick={() => setPage({ name: "list" })} style={{
        background: "transparent", border: "none", cursor: "pointer",
        fontFamily: "'Fredoka'", fontWeight: 600, fontSize: 15,
        color: "var(--ink)", opacity: 0.7,
        display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 0 18px",
      }}>
        ← Back to all stickers
      </button>

      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <div style={{
            display: "inline-block",
            background: set.color, color: "var(--ink)",
            fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 12,
            padding: "5px 12px", borderRadius: 999,
            border: "2px solid var(--ink)",
            textTransform: "uppercase", letterSpacing: 1,
            transform: "rotate(-2deg)",
          }}>Sticker set</div>
          <h1 style={{
            fontFamily: "'Bagel Fat One', cursive",
            fontSize: "clamp(40px, 5vw, 64px)",
            margin: "8px 0 6px", lineHeight: 0.95, letterSpacing: -1,
          }}>{set.name}</h1>
          <p style={{
            fontFamily: "'Caveat', cursive", fontSize: 24, margin: 0,
            opacity: 0.85,
          }}>{set.tagline}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", paddingBottom: 8 }}>
          <PriceTag amount={PRICE_SHEET} color="white" rot={-4} />
          <PriceTag amount={PRICE_PAIR} color="var(--yellow)" rot={6} size="lg" />
        </div>
      </div>

      {/* Big content grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.1fr 1fr",
        gap: 36,
        alignItems: "start",
      }}>
        {/* LEFT — hero preview */}
        <div className="sticker" style={{
          background: "white", padding: 16,
          transform: "rotate(-0.8deg)",
        }}>
          <div style={{
            background: "var(--paper-2)",
            borderRadius: 14, overflow: "hidden",
            position: "relative",
          }}>
            <img src={set.image} alt={set.name} style={{
              width: "100%", display: "block",
            }} />
            {/* Corner sparkles */}
            <div style={{ position: "absolute", top: 12, left: 12,
              background: "white", border: "3px solid var(--ink)", borderRadius: 999,
              padding: "5px 12px", fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 13,
              boxShadow: "0 3px 0 rgba(42,34,56,0.85)",
            }}>2 sheets</div>
          </div>
          <div style={{ padding: "16px 6px 4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <SheetMini side="left" image={set.image} label={set.sheetA.name} highlights={set.sheetA.highlights} />
            <SheetMini side="right" image={set.image} label={set.sheetB.name} highlights={set.sheetB.highlights} />
          </div>
        </div>

        {/* RIGHT — choices + add to cart */}
        <div>
          <h2 style={{
            fontFamily: "'Bagel Fat One', cursive", fontSize: 28, margin: "0 0 14px",
          }}>What do you want?</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <SheetChoice
              image={set.image} side="left"
              label={set.sheetA.name}
              blurb={set.sheetA.blurb}
              highlights={set.sheetA.highlights}
              selected={choice === "a"}
              onSelect={() => setChoice("a")}
              color={set.color}
            />
            <SheetChoice
              image={set.image} side="right"
              label={set.sheetB.name}
              blurb={set.sheetB.blurb}
              highlights={set.sheetB.highlights}
              selected={choice === "b"}
              onSelect={() => setChoice("b")}
              color={set.color}
            />
          </div>

          <PairChoice
            image={set.image}
            label="Both sheets"
            selected={choice === "pair"}
            onSelect={() => setChoice("pair")}
            color={set.color}
          />

          {/* Add to cart row */}
          <div style={{
            marginTop: 22, padding: 18,
            background: "white",
            border: "3px solid var(--ink)", borderRadius: 18,
            boxShadow: "0 6px 0 rgba(42,34,56,0.85)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Stepper value={qty} onChange={setQty} />
              <div>
                <div style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: 13, opacity: 0.7 }}>
                  {choice === "pair" ? "Pair · 2 sheets" : choice === "a" ? set.sheetA.name : set.sheetB.name}
                </div>
                <div style={{ fontFamily: "'Bagel Fat One', cursive", fontSize: 30, lineHeight: 1 }}>
                  ${total}
                </div>
              </div>
            </div>
            <BigButton onClick={handleAdd} color={added ? "var(--mint)" : "var(--pink)"}>
              {added ? "Added! ✓" : "Add to cart"}
            </BigButton>
          </div>

          <p style={{
            fontFamily: "'Caveat', cursive", fontSize: 22, opacity: 0.7,
            margin: "16px 0 0", textAlign: "center",
          }}>
            Psst — the pair saves you a buck!
          </p>
        </div>
      </div>
    </main>
  );
}

function SheetMini({ side, image, label, highlights }) {
  return (
    <div>
      <div style={{
        position: "relative",
        borderRadius: 10, overflow: "hidden",
        background: "white",
        aspectRatio: "3 / 4",
        border: "2px dashed rgba(42,34,56,0.25)",
      }}>
        <img src={image} alt={label} style={{
          position: "absolute", top: 0,
          left: side === "left" ? 0 : "-100%",
          width: "200%", height: "100%", objectFit: "cover", display: "block",
        }} />
      </div>
      <div style={{
        fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 14, marginTop: 8,
      }}>Sheet {side === "left" ? "A" : "B"}: {label}</div>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6,
      }}>
        {highlights.slice(0, 4).map((h) => (
          <span key={h} style={{
            fontSize: 11.5, padding: "2px 8px",
            background: "var(--paper-2)", borderRadius: 999,
            border: "1.5px solid rgba(42,34,56,0.2)",
            fontFamily: "'Fredoka'", fontWeight: 500,
          }}>{h}</span>
        ))}
      </div>
    </div>
  );
}

// ---------- CART PAGE ----------
function CartPage({ cart, updateQty, removeItem, setPage, placeOrder }) {
  const [form, setForm] = useState({ name: "", email: "", address: "", notes: "" });
  const [showSuccess, setShowSuccess] = useState(false);
  const [confettiOn, setConfettiOn] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const subtotal = cart.reduce((sum, it) => sum + it.price * it.qty, 0);
  const itemCount = cart.reduce((sum, it) => sum + it.qty, 0);
  const shipping = itemCount > 0 ? 1 : 0; // playful flat ship for vibes
  const total = subtotal + shipping;

  const canPlace = cart.length > 0 && form.name.trim() && form.address.trim();

  const handlePlace = (e) => {
    e.preventDefault();
    if (!canPlace) return;
    const order = {
      id: "SS-" + Date.now().toString().slice(-6),
      placedAt: new Date().toISOString(),
      items: cart, customer: form, subtotal, shipping, total,
    };
    placeOrder(order);
    setLastOrder(order);
    setShowSuccess(true);
    setConfettiOn(true);
    setTimeout(() => setConfettiOn(false), 3500);
  };

  if (showSuccess && lastOrder) {
    return <SuccessPage order={lastOrder} setPage={setPage} confettiOn={confettiOn} />;
  }

  return (
    <main style={{ position: "relative", zIndex: 2, maxWidth: 1180, margin: "0 auto", padding: "8px 32px 80px" }}>
      <button onClick={() => setPage({ name: "list" })} style={{
        background: "transparent", border: "none", cursor: "pointer",
        fontFamily: "'Fredoka'", fontWeight: 600, fontSize: 15,
        color: "var(--ink)", opacity: 0.7,
        display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 0 18px",
      }}>← Keep shopping</button>

      <h1 style={{
        fontFamily: "'Bagel Fat One', cursive",
        fontSize: "clamp(40px, 5vw, 64px)", margin: "0 0 6px", letterSpacing: -1,
      }}>Your sticker stash</h1>
      <p style={{
        fontFamily: "'Caveat', cursive", fontSize: 24, opacity: 0.8, margin: "0 0 26px",
      }}>{itemCount === 0 ? "It's a little empty in here..." : `${itemCount} ${itemCount === 1 ? "item" : "items"} ready to ship`}</p>

      {cart.length === 0 ? (
        <EmptyCart setPage={setPage} />
      ) : (
        <div style={{
          display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32,
          alignItems: "start",
        }}>
          {/* ITEMS */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {cart.map((item) => (
              <CartItem key={item.sheetId} item={item} updateQty={updateQty} removeItem={removeItem} />
            ))}
          </div>

          {/* CHECKOUT */}
          <div style={{
            background: "white",
            border: "3px solid var(--ink)", borderRadius: 22,
            padding: 22,
            boxShadow: "0 8px 0 rgba(42,34,56,0.85)",
            position: "sticky", top: 20,
          }}>
            <h2 style={{
              fontFamily: "'Bagel Fat One', cursive", fontSize: 24, margin: "0 0 14px",
            }}>Place your order</h2>

            <form onSubmit={handlePlace} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Your name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Sam Sticker" />
              <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="optional, for updates" type="email" />
              <Field label="Mailing address *" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Street, city, zip" multiline />
              <Field label="Anything else?" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Gift wrap? A drawing?" multiline />

              <div style={{
                marginTop: 8, padding: "14px 0 4px",
                borderTop: "2px dashed rgba(42,34,56,0.25)",
                display: "flex", flexDirection: "column", gap: 6,
                fontFamily: "'Fredoka'", fontWeight: 600,
              }}>
                <Row label="Stickers" value={`$${subtotal}`} />
                <Row label="Shipping" value={`$${shipping}`} />
                <Row label="Total" value={`$${total}`} big />
              </div>

              <BigButton onClick={handlePlace} disabled={!canPlace} color="var(--pink)" style={{ marginTop: 8, fontSize: 20 }}>
                Place order →
              </BigButton>
              <p style={{
                fontSize: 12.5, textAlign: "center", margin: 0, opacity: 0.7,
                fontFamily: "'Fredoka'",
              }}>
                No payment now! We'll get back to you to arrange it.
              </p>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function EmptyCart({ setPage }) {
  return (
    <div style={{
      background: "white", border: "3px solid var(--ink)", borderRadius: 22,
      padding: "40px 28px", textAlign: "center", maxWidth: 520, margin: "0 auto",
      boxShadow: "0 8px 0 rgba(42,34,56,0.85)",
    }}>
      <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 8 }}>🤷</div>
      <h2 style={{ fontFamily: "'Bagel Fat One', cursive", margin: "0 0 6px", fontSize: 28 }}>No stickers yet!</h2>
      <p style={{ fontFamily: "'Caveat', cursive", fontSize: 22, opacity: 0.8, margin: "0 0 18px" }}>
        Go pick a few. They're only $2 a sheet.
      </p>
      <BigButton onClick={() => setPage({ name: "list" })} color="var(--blue)">
        Browse stickers
      </BigButton>
    </div>
  );
}

function CartItem({ item, updateQty, removeItem }) {
  return (
    <div className="sticker" style={{
      background: "white", padding: 14,
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      gap: 14, alignItems: "center",
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 12, overflow: "hidden",
        background: "var(--paper-2)",
        border: "2px solid rgba(42,34,56,0.2)",
        position: "relative", flexShrink: 0,
      }}>
        <img src={item.image} alt={item.name} style={{
          position: "absolute", top: 0,
          left: item.side === "left" ? 0 : item.side === "right" ? "-100%" : 0,
          width: item.side === "full" ? "100%" : "200%",
          height: "100%", objectFit: "cover", display: "block",
        }} />
      </div>
      <div>
        <div style={{ fontFamily: "'Bagel Fat One', cursive", fontSize: 19, lineHeight: 1.1 }}>
          {item.name}
        </div>
        <div style={{
          fontFamily: "'Fredoka'", fontWeight: 600, fontSize: 13, opacity: 0.7, marginTop: 2,
        }}>
          {item.kind === "pair" ? "Pair · 2 sheets" : "Single sheet"} · ${item.price} each
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
          <Stepper value={item.qty} onChange={(v) => updateQty(item.sheetId, v)} min={1} />
          <button onClick={() => removeItem(item.sheetId)} style={{
            background: "transparent", border: "none", cursor: "pointer",
            fontFamily: "'Fredoka'", fontWeight: 600, fontSize: 13,
            color: "var(--ink)", opacity: 0.55, textDecoration: "underline",
          }}>remove</button>
        </div>
      </div>
      <div style={{
        fontFamily: "'Bagel Fat One', cursive", fontSize: 26, lineHeight: 1, alignSelf: "center",
      }}>
        ${item.price * item.qty}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", multiline }) {
  const common = {
    width: "100%",
    fontFamily: "'Fredoka'", fontWeight: 500, fontSize: 15,
    padding: "10px 14px",
    border: "2.5px solid var(--ink)",
    borderRadius: 12,
    background: "var(--paper)",
    color: "var(--ink)",
    outline: "none",
    resize: "none",
  };
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 13.5 }}>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} style={common} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={common} />
      )}
    </label>
  );
}

function Row({ label, value, big }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      fontSize: big ? 22 : 15,
      fontFamily: big ? "'Bagel Fat One', cursive" : "'Fredoka'",
      fontWeight: big ? 400 : 600,
      paddingTop: big ? 6 : 0,
    }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

// ---------- SUCCESS PAGE ----------
function SuccessPage({ order, setPage, confettiOn }) {
  return (
    <main style={{
      position: "relative", zIndex: 2,
      maxWidth: 720, margin: "40px auto", padding: "0 32px 80px",
      textAlign: "center",
    }}>
      <Confetti active={confettiOn} />

      <div style={{
        background: "white", border: "3px solid var(--ink)", borderRadius: 26,
        padding: "44px 32px", boxShadow: "0 10px 0 rgba(42,34,56,0.85)",
        animation: "pop .4s",
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: "50%",
          background: "var(--mint)", margin: "0 auto 18px",
          border: "4px solid var(--ink)",
          display: "grid", placeItems: "center",
          boxShadow: "0 6px 0 rgba(42,34,56,0.85)",
          transform: "rotate(-6deg)",
        }}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>

        <h1 style={{
          fontFamily: "'Bagel Fat One', cursive",
          fontSize: "clamp(36px, 5vw, 56px)", margin: "0 0 6px", letterSpacing: -1,
        }}>Yay! Order placed!</h1>
        <p style={{ fontFamily: "'Caveat', cursive", fontSize: 26, opacity: 0.85, margin: "0 0 22px" }}>
          We've saved your order. Stickers are on their way to you soon!
        </p>

        <div style={{
          background: "var(--paper-2)", borderRadius: 16, padding: 18,
          textAlign: "left", marginBottom: 20,
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            fontFamily: "'Fredoka'", fontWeight: 700, fontSize: 14, opacity: 0.75,
            marginBottom: 12,
          }}>
            <span>Order #{order.id}</span>
            <span>Total: ${order.total}</span>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {order.items.map((it) => (
              <li key={it.sheetId} style={{
                display: "flex", justifyContent: "space-between",
                fontFamily: "'Fredoka'", fontSize: 15,
              }}>
                <span>{it.qty}× {it.name}</span>
                <span style={{ fontWeight: 700 }}>${it.qty * it.price}</span>
              </li>
            ))}
          </ul>
          <div style={{
            marginTop: 12, paddingTop: 10, borderTop: "2px dashed rgba(42,34,56,0.25)",
            fontFamily: "'Fredoka'", fontWeight: 600, fontSize: 14,
          }}>
            Shipping to: <span style={{ opacity: 0.8 }}>{order.customer.name} · {order.customer.address}</span>
          </div>
        </div>

        <BigButton onClick={() => setPage({ name: "list" })} color="var(--pink)">
          Back to stickers
        </BigButton>
      </div>
    </main>
  );
}

Object.assign(window, { ListPage, DetailPage, CartPage, SuccessPage });
