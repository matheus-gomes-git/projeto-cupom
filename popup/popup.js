const STORE_LABELS = {
  mercadolivre: { name: "Mercado Livre", emoji: "🛒" },
  amazon: { name: "Amazon", emoji: "📦" },
  shopee: { name: "Shopee", emoji: "🛍️" },
  magalu: { name: "Magazine Luiza", emoji: "🏪" },
  casasbahia: { name: "Casas Bahia", emoji: "🏠" },
  aliexpress: { name: "AliExpress", emoji: "✈️" },
};

const storeStatus = {};
let allResults = [];
let currentProduct = null;
let activeCurrency = "BRL";

const elProductName = document.getElementById("product-name");
const elStateDetecting = document.getElementById("state-detecting");
const elStateNoProduct = document.getElementById("state-no-product");
const elStateSearching = document.getElementById("state-searching");
const elStateResults = document.getElementById("state-results");
const elStoreListLoading = document.getElementById("store-list-loading");
const elResultsList = document.getElementById("results-list");
const elCurrencyToggle = document.getElementById("currency-toggle");
const elRefreshBtn = document.getElementById("refresh-btn");

function showState(name) {
  [elStateDetecting, elStateNoProduct, elStateSearching, elStateResults].forEach(el =>
    el.classList.add("hidden")
  );
  document.getElementById(`state-${name}`)?.classList.remove("hidden");
}

function renderStoreSkeletons() {
  elStoreListLoading.innerHTML = Object.entries(STORE_LABELS)
    .map(([id, { name }]) => `
      <div class="store-loading" id="store-row-${id}">
        <span class="store-dot searching" id="dot-${id}"></span>
        <span>${name}</span>
      </div>
    `).join("");
}

function markStoreDone(storeId, hasResults) {
  storeStatus[storeId] = hasResults ? "done" : "error";
  const dot = document.getElementById(`dot-${storeId}`);
  if (dot) {
    dot.classList.remove("searching");
    dot.classList.add(hasResults ? "done" : "error");
  }
}

function formatPrice(price, currency) {
  if (currency === "BRL") return `R$ ${price.toFixed(2).replace(".", ",")}`;
  return `US$ ${price.toFixed(2)}`;
}

function renderResults(results) {
  const hasBRL = results.some(r => r.currency === "BRL");
  const hasUSD = results.some(r => r.currency === "USD");

  if (hasBRL && hasUSD) {
    elCurrencyToggle.classList.remove("hidden");
  } else {
    elCurrencyToggle.classList.add("hidden");
    activeCurrency = hasBRL ? "BRL" : "USD";
  }

  const filtered = results.filter(r => r.currency === activeCurrency);
  const sorted = [...filtered].sort((a, b) => a.price - b.price);
  const minPrice = sorted[0]?.price;

  if (sorted.length === 0) {
    elResultsList.innerHTML = `<p class="no-results">Nenhum resultado encontrado para este produto.</p>`;
    return;
  }

  elResultsList.innerHTML = sorted.map((item, i) => {
    const isBest = i === 0 && item.price === minPrice;
    const thumb = item.thumbnail
      ? `<img class="result-thumb" src="${item.thumbnail}" alt="" loading="lazy" />`
      : `<div class="result-thumb-placeholder">${STORE_LABELS[getStoreId(item.store)]?.emoji || "🛒"}</div>`;

    return `
      <a class="result-item" href="${item.url}" target="_blank" rel="noopener">
        ${thumb}
        <div class="result-info">
          <span class="result-store">${item.store}${isBest ? '<span class="badge-best">Melhor preço</span>' : ""}</span>
          <div class="result-name" title="${item.name}">${item.name}</div>
        </div>
        <div class="result-price ${item.currency === "USD" ? "usd" : ""}">
          ${formatPrice(item.price, item.currency)}
        </div>
      </a>
    `;
  }).join("");
}

function getStoreId(storeName) {
  return Object.entries(STORE_LABELS)
    .find(([, v]) => v.name === storeName)?.[0] || "";
}

// Ouve mensagens do service worker
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SEARCH_STARTED") {
    showState("searching");
    renderStoreSkeletons();
  }

  if (message.type === "STORE_RESULTS") {
    markStoreDone(message.store, message.results.length > 0);
    allResults = allResults.filter(r => getStoreId(r.store) !== message.store);
    allResults.push(...message.results);
  }

  if (message.type === "STORE_ERROR") {
    markStoreDone(message.store, false);
  }

  if (message.type === "RESULTS_READY") {
    allResults = message.results;
    showState("results");
    renderResults(allResults);
  }
});

// Currency toggle
elCurrencyToggle.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    activeCurrency = btn.dataset.currency;
    elCurrencyToggle.querySelectorAll("button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderResults(allResults);
  });
});

// Refresh
elRefreshBtn.addEventListener("click", () => {
  if (!currentProduct) return;
  allResults = [];
  showState("searching");
  renderStoreSkeletons();
  chrome.runtime.sendMessage({ type: "FORCE_SEARCH" });
});

// Inicialização
async function init() {
  showState("detecting");

  const res = await chrome.runtime.sendMessage({ type: "GET_PRODUCT" });
  const product = res?.product;

  if (!product) {
    elProductName.textContent = "Nenhum produto detectado";
    showState("no-product");
    return;
  }

  currentProduct = product;
  elProductName.textContent = product;

  const cacheRes = await chrome.runtime.sendMessage({
    type: "GET_CACHED_RESULTS",
    productName: product,
  });

  if (cacheRes?.results?.length > 0) {
    allResults = cacheRes.results;
    showState("results");
    renderResults(allResults);
  } else {
    showState("searching");
    renderStoreSkeletons();
  }
}

init();
