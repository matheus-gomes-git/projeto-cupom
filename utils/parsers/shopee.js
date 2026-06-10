export async function searchShopee(productName) {
  const query = encodeURIComponent(productName);
  const url = `https://shopee.com.br/api/v4/search/search_items?by=relevancy&keyword=${query}&limit=5&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`;

  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!res.ok) throw new Error(`Shopee HTTP ${res.status}`);

  const data = await res.json();
  const items = data?.items || [];

  return items.map(item => {
    const info = item.item_basic || item;
    const price = info.price / 100000;
    const shopId = info.shopid;
    const itemId = info.itemid;
    return {
      store: "Shopee",
      name: info.name,
      price,
      currency: "BRL",
      url: `https://shopee.com.br/product/${shopId}/${itemId}`,
      thumbnail: info.image ? `https://cf.shopee.com.br/file/${info.image}` : null,
    };
  });
}
