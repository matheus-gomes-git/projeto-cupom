export async function searchAmazon(productName) {
  const query = encodeURIComponent(productName);
  const url = `https://www.amazon.com.br/s?k=${query}`;

  const res = await fetch(url, {
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "pt-BR,pt;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`Amazon HTTP ${res.status}`);

  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const items = [];
  const cards = doc.querySelectorAll('[data-component-type="s-search-result"]');

  for (const card of Array.from(cards).slice(0, 5)) {
    const nameEl = card.querySelector("h2 span");
    const priceWhole = card.querySelector(".a-price-whole");
    const priceFraction = card.querySelector(".a-price-fraction");
    const linkEl = card.querySelector("h2 a");
    const imgEl = card.querySelector(".s-image");

    if (!nameEl || !priceWhole) continue;

    const priceStr = (priceWhole.textContent.replace(/\./g, "").replace(",", ".") +
      "." + (priceFraction?.textContent || "00")).replace(/\.$/, "");
    const price = parseFloat(priceStr);
    if (isNaN(price)) continue;

    items.push({
      store: "Amazon",
      name: nameEl.textContent.trim(),
      price,
      currency: "BRL",
      url: "https://www.amazon.com.br" + linkEl?.getAttribute("href"),
      thumbnail: imgEl?.src || null,
    });
  }

  return items;
}
