export async function searchAliExpress(productName) {
  const query = encodeURIComponent(productName);
  const url = `https://www.aliexpress.com/wholesale?SearchText=${query}&SortType=total_tranpro_desc`;

  const res = await fetch(url, {
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`AliExpress HTTP ${res.status}`);

  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const items = [];

  // Tenta extrair dados do script de inicialização (window._dida_config_ ou similar)
  const scripts = doc.querySelectorAll("script");
  for (const script of scripts) {
    if (!script.textContent.includes("listItems")) continue;
    try {
      const match = script.textContent.match(/window\.__moduleData__\s*=\s*(\{.*?\});/s);
      if (!match) continue;
      const data = JSON.parse(match[1]);
      const list = data?.data?.root?.fields?.mods?.itemList?.content || [];
      for (const item of list.slice(0, 5)) {
        const price = parseFloat(item?.prices?.salePrice?.minPrice || 0);
        if (!price) continue;
        items.push({
          store: "AliExpress",
          name: item.title?.seoTitle || item.title?.displayTitle || "",
          price,
          currency: "USD",
          url: "https:" + (item.productDetailUrl || ""),
          thumbnail: item.image?.imgUrl ? "https:" + item.image.imgUrl : null,
        });
      }
      if (items.length > 0) break;
    } catch {}
  }

  // Fallback: parse HTML direto
  if (items.length === 0) {
    const cards = doc.querySelectorAll(".list--gallery--C2f2tvm .item, [class*='product-item']");
    for (const card of Array.from(cards).slice(0, 5)) {
      const nameEl = card.querySelector("h3, [class*='title']");
      const priceEl = card.querySelector("[class*='price']");
      const linkEl = card.querySelector("a");
      const imgEl = card.querySelector("img");
      if (!nameEl || !priceEl) continue;
      const priceStr = priceEl.textContent.replace(/[^\d.,]/g, "").replace(",", ".");
      const price = parseFloat(priceStr);
      if (isNaN(price)) continue;
      const href = linkEl?.getAttribute("href") || "";
      items.push({
        store: "AliExpress",
        name: nameEl.textContent.trim(),
        price,
        currency: "USD",
        url: href.startsWith("http") ? href : "https://www.aliexpress.com" + href,
        thumbnail: imgEl?.src || null,
      });
    }
  }

  return items;
}
