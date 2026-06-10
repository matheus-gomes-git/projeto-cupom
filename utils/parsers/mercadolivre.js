export async function searchMercadoLivre(productName) {
  const query = encodeURIComponent(productName);
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${query}&limit=5`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`MercadoLivre HTTP ${res.status}`);

  const data = await res.json();
  const results = data.results || [];

  return results.map(item => ({
    store: "Mercado Livre",
    name: item.title,
    price: item.price,
    currency: "BRL",
    url: item.permalink,
    thumbnail: item.thumbnail,
  }));
}
