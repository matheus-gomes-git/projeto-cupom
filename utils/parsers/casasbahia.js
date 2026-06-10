export async function searchCasasBahia(productName) {
  const query = encodeURIComponent(productName);
  const url = `https://www.casasbahia.com.br/busca/${query}`;

  const res = await fetch(url, {
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "pt-BR,pt;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`Casas Bahia HTTP ${res.status}`);

  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const items = [];
  const cards = doc.querySelectorAll('[data-testid="product-card"], .product-card, [class*="ProductCard"]');

  for (const card of Array.from(cards).slice(0, 5)) {
    const nameEl = card.querySelector('h2, [class*="title"], [class*="name"]');
    const priceEl = card.querySelector('[class*="price"], [data-testid="price"]');
    const linkEl = card.querySelector("a");
    const imgEl = card.querySelector("img");

    if (!nameEl || !priceEl) continue;

    const priceStr = priceEl.textContent.replace(/[^\d,]/g, "").replace(",", ".");
    const price = parseFloat(priceStr);
    if (isNaN(price)) continue;

    const href = linkEl?.getAttribute("href") || "";
    items.push({
      store: "Casas Bahia",
      name: nameEl.textContent.trim(),
      price,
      currency: "BRL",
      url: href.startsWith("http") ? href : "https://www.casasbahia.com.br" + href,
      thumbnail: imgEl?.src || null,
    });
  }

  return items;
}
