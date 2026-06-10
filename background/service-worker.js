import { searchMercadoLivre } from "../utils/parsers/mercadolivre.js";
import { searchAmazon } from "../utils/parsers/amazon.js";
import { searchShopee } from "../utils/parsers/shopee.js";
import { searchMagalu } from "../utils/parsers/magalu.js";
import { searchCasasBahia } from "../utils/parsers/casasbahia.js";
import { searchAliExpress } from "../utils/parsers/aliexpress.js";

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

const SEARCHERS = [
  { id: "mercadolivre", fn: searchMercadoLivre },
  { id: "amazon", fn: searchAmazon },
  { id: "shopee", fn: searchShopee },
  { id: "magalu", fn: searchMagalu },
  { id: "casasbahia", fn: searchCasasBahia },
  { id: "aliexpress", fn: searchAliExpress },
];

function cacheKey(productName) {
  return "cache_" + productName.toLowerCase().replace(/\s+/g, "_").substring(0, 80);
}

async function getCached(productName) {
  const key = cacheKey(productName);
  const stored = await chrome.storage.local.get(key);
  const entry = stored[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
  return entry.results;
}

async function setCache(productName, results) {
  const key = cacheKey(productName);
  await chrome.storage.local.set({ [key]: { results, timestamp: Date.now() } });
}

async function searchAllStores(productName, tabId) {
  const cached = await getCached(productName);
  if (cached) {
    notifyTab(tabId, { type: "RESULTS_READY", results: cached, fromCache: true });
    updateBadge(tabId, cached);
    return;
  }

  notifyTab(tabId, { type: "SEARCH_STARTED", productName });

  const promises = SEARCHERS.map(({ id, fn }) =>
    fn(productName)
      .then(results => {
        notifyTab(tabId, { type: "STORE_RESULTS", store: id, results });
        return results;
      })
      .catch(err => {
        console.warn(`[${id}] falhou:`, err.message);
        notifyTab(tabId, { type: "STORE_ERROR", store: id, error: err.message });
        return [];
      })
  );

  const settled = await Promise.allSettled(promises);
  const allResults = settled
    .filter(r => r.status === "fulfilled")
    .flatMap(r => r.value);

  await setCache(productName, allResults);
  notifyTab(tabId, { type: "RESULTS_READY", results: allResults, fromCache: false });
  updateBadge(tabId, allResults);
}

function notifyTab(tabId, message) {
  chrome.tabs.sendMessage(tabId, message).catch(() => {});
  // também notifica o popup se estiver aberto
  chrome.runtime.sendMessage(message).catch(() => {});
}

function updateBadge(tabId, results) {
  const brlResults = results.filter(r => r.currency === "BRL");
  if (brlResults.length === 0) {
    chrome.action.setBadgeText({ text: "", tabId });
    return;
  }
  const minPrice = Math.min(...brlResults.map(r => r.price));
  const label = minPrice >= 1000
    ? `${(minPrice / 1000).toFixed(1)}k`
    : Math.round(minPrice).toString();
  chrome.action.setBadgeText({ text: label, tabId });
  chrome.action.setBadgeBackgroundColor({ color: "#16a34a", tabId });
}

// Armazena o produto detectado por aba
const tabProducts = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PRODUCT_DETECTED" && sender.tab?.id) {
    const tabId = sender.tab.id;
    const prev = tabProducts.get(tabId);
    if (prev !== message.productName) {
      tabProducts.set(tabId, message.productName);
      searchAllStores(message.productName, tabId);
    }
    sendResponse({ ok: true });
  }

  if (message.type === "GET_PRODUCT") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab) return sendResponse({ product: null });
      const product = tabProducts.get(tab.id) || null;
      sendResponse({ product });
    });
    return true; // assíncrono
  }

  if (message.type === "GET_CACHED_RESULTS") {
    const { productName } = message;
    getCached(productName).then(results => sendResponse({ results }));
    return true;
  }

  if (message.type === "FORCE_SEARCH") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab) return;
      const product = tabProducts.get(tab.id);
      if (product) searchAllStores(product, tab.id);
    });
  }
});

// Limpa dados da aba ao fechar
chrome.tabs.onRemoved.addListener(tabId => {
  tabProducts.delete(tabId);
  chrome.action.setBadgeText({ text: "", tabId });
});
