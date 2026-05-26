// Top-level app — state, routing, cart logic.

function App() {
  const [page, setPage] = useState({ name: "list" });
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sticker-stop-cart") || "[]"); }
    catch { return []; }
  });
  const [orders, setOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sticker-stop-orders") || "[]"); }
    catch { return []; }
  });

  // Persist
  useEffect(() => { localStorage.setItem("sticker-stop-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("sticker-stop-orders", JSON.stringify(orders)); }, [orders]);

  // Scroll top on page change
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [page]);

  const addToCart = (item, qty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.sheetId === item.sheetId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { ...item, qty }];
    });
  };
  const updateQty = (sheetId, qty) => {
    setCart((prev) => prev.map((p) => p.sheetId === sheetId ? { ...p, qty } : p));
  };
  const removeItem = (sheetId) => {
    setCart((prev) => prev.filter((p) => p.sheetId !== sheetId));
  };
  const placeOrder = (order) => {
    setOrders((prev) => [...prev, order]);
    setCart([]);
    // Pretend to "send" — log a fake JSON for demo purposes
    console.log("📮 Sending order to Sticker Stop HQ:", order);
  };

  const cartCount = cart.reduce((sum, it) => sum + it.qty, 0);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <DoodleLayer />
      <div style={{ position: "relative", zIndex: 2 }}>
        <Header page={page} setPage={setPage} cartCount={cartCount} />

        {page.name === "list" && <ListPage setPage={setPage} addToCart={addToCart} />}
        {page.name === "detail" && <DetailPage id={page.id} setPage={setPage} addToCart={addToCart} />}
        {page.name === "cart" && (
          <CartPage
            cart={cart}
            updateQty={updateQty}
            removeItem={removeItem}
            setPage={setPage}
            placeOrder={placeOrder}
          />
        )}

        {/* Footer */}
        <footer style={{
          maxWidth: 1180, margin: "20px auto 0", padding: "30px 32px 36px",
          textAlign: "center",
          fontFamily: "'Caveat', cursive", fontSize: 20, opacity: 0.6,
        }}>
          <div style={{ marginBottom: 6 }}>Made with stickers, by stickers, for stickers.</div>
          <div style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
            © Sticker Stop · 2026
          </div>
        </footer>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
