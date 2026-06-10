export async function searchMagalu(productName) {
  const query = encodeURIComponent(productName);
  const url = `https://www.magazineluiza.com.br/busca/${query}/`;

  const res = await fetch(url, {
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "pt-BR,pt;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`Magalu HTTP ${res.status}`);

  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const items = [];
  const cards = doc.querySelectorAll('[data-testid="product-card"]');

  for (const card of Array.from(cards).slice(0, 5)) {
    const nameEl = card.querySelector('[data-testid="product-title"], h2');
    const priceEl = card.querySelector('[data-testid="price-value"], [class*="price"]');
    const linkEl = card.querySelector("a");
    const imgEl = card.querySelector("img");

    if (!nameEl || !priceEl) continue;

    const priceStr = priceEl.textContent.replace(/[^\d,]/g, "").replace(",", ".");
    const price = parseFloat(priceStr);
    if (isNaN(price)) continue;

    const href = linkEl?.getAttribute("href") || "";
    items.push({
      store: "Magazine Luiza",
      name: nameEl.textContent.trim(),
      price,
      currency: "BRL",
      url: href.startsWith("http") ? href : "https://www.magazineluiza.com.br" + href,
      thumbnail: imgEl?.src || null,
    });
  }

  return items;
}
