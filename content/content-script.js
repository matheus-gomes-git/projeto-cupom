const SITE_SELECTORS = {
  "mercadolivre.com.br": ".ui-pdp-title",
  "amazon.com.br": "#productTitle",
  "shopee.com.br": ".BHqC7 .pPjXi, ._44qnta",
  "magazineluiza.com.br": "h1[data-testid='product-title'], h1.sc-dcJsrY",
  "casasbahia.com.br": "h1.product-title__title, h1[class*='product-name']",
  "aliexpress.com": "h1.product-title-text",
  "americanas.com.br": "h1[class*='product-title'], .product-title",
};

const SUFFIX_PATTERNS = [
  /\s*[\|–\-]\s*.{0,40}$/,
  /\s*:\s*amazon\.com\.br$/i,
  /\s*-\s*(compre|veja|loja|oferta).*/i,
];

function extractFromJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item["@type"] === "Product" && item.name) return item.name;
        if (item["@graph"]) {
          const product = item["@graph"].find(n => n["@type"] === "Product");
          if (product?.name) return product.name;
        }
      }
    } catch {}
  }
  return null;
}

function extractFromOgTitle() {
  const meta = document.querySelector('meta[property="og:title"]');
  if (!meta?.content) return null;
  let title = meta.content.trim();
  for (const pattern of SUFFIX_PATTERNS) {
    title = title.replace(pattern, "");
  }
  return title.trim() || null;
}

function extractFromSiteSelector() {
  const hostname = window.location.hostname;
  for (const [domain, selector] of Object.entries(SITE_SELECTORS)) {
    if (hostname.includes(domain)) {
      const el = document.querySelector(selector);
      return el?.innerText?.trim() || null;
    }
  }
  return null;
}

function extractFromH1() {
  const h1 = document.querySelector("h1");
  return h1?.innerText?.trim() || null;
}

function cleanProductName(name) {
  if (!name) return null;
  return name
    .replace(/\s{2,}/g, " ")
    .replace(/^\s+|\s+$/g, "")
    .substring(0, 150);
}

function isProductPage() {
  if (extractFromJsonLd()) return true;
  if (document.querySelector('meta[property="og:type"]')?.content === "product") return true;
  const hostname = window.location.hostname;
  return Object.keys(SITE_SELECTORS).some(domain => hostname.includes(domain));
}

function extractProductName() {
  const raw =
    extractFromJsonLd() ||
    extractFromSiteSelector() ||
    extractFromOgTitle() ||
    extractFromH1();
  return cleanProductName(raw);
}

function sendProductToBackground() {
  if (!isProductPage()) return;
  const name = extractProductName();
  if (!name) return;

  chrome.runtime.sendMessage({
    type: "PRODUCT_DETECTED",
    productName: name,
    url: window.location.href,
  });
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  sendProductToBackground();
} else {
  document.addEventListener("DOMContentLoaded", sendProductToBackground);
}
