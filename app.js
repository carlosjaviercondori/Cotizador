const itemsBody = document.querySelector("#items-body");
const grandTotal = document.querySelector("#grand-total");
const form = document.querySelector("#quote-form");
const toast = document.querySelector("#toast");
const storageKey = "dayplas-cotizacion";
const historyKey = "dayplas-cotizaciones-historial";
const submitButton = document.querySelector("#submit-quote");
const historyList = document.querySelector("#history-list");
const historyEmpty = document.querySelector("#history-empty");
const historyCount = document.querySelector("#history-count");
const historySearch = document.querySelector("#history-search");
const historySummary = document.querySelector("#history-summary");
let currentEditId = null;
let editingExisting = false;

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 });

function addRow(item = {}) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input class="quantity" type="number" min="0" step="any" value="${item.quantity ?? ""}" placeholder="0" aria-label="Cantidad" required></td>
    <td><input class="detail" type="text" value="${escapeHtml(item.detail ?? "")}" placeholder="Producto o servicio" aria-label="Detalle" required></td>
    <td><input class="unit-price" type="number" min="0" step="0.01" value="${item.unitPrice ?? ""}" placeholder="0,00" aria-label="Precio unitario final con IVA" required></td>
    <td><input class="row-total" type="text" value="${money.format(0)}" readonly aria-label="Precio total final"></td>
    <td><button class="remove-row" type="button" title="Quitar fila" aria-label="Quitar fila">×</button></td>
  `;
  itemsBody.append(row);
  row.addEventListener("input", calculateTotals);
  row.querySelector(".remove-row").addEventListener("click", () => {
    if (itemsBody.children.length > 1) {
      row.remove();
      calculateTotals();
    } else {
      row.querySelectorAll("input").forEach(input => { if (!input.readOnly) input.value = ""; });
      calculateTotals();
    }
  });
  calculateTotals();
}

function calculateTotals() {
  let total = 0;
  itemsBody.querySelectorAll("tr").forEach(row => {
    const quantity = Number(row.querySelector(".quantity").value) || 0;
    const unitPrice = Number(row.querySelector(".unit-price").value) || 0;
    const rowTotal = quantity * unitPrice;
    total += rowTotal;
    row.querySelector(".row-total").value = money.format(rowTotal);
  });
  grandTotal.textContent = money.format(total);
  saveDraft();
}

function collectData() {
  return {
    date: document.querySelector("#quote-date").value,
    customer: document.querySelector("#customer").value,
    taxId: document.querySelector("#tax-id").value,
    address: document.querySelector("#address").value,
    seller: document.querySelector("#seller").value,
    terms: document.querySelector("#terms").value,
    items: [...itemsBody.querySelectorAll("tr")].map(row => ({
      quantity: row.querySelector(".quantity").value,
      detail: row.querySelector(".detail").value,
      unitPrice: row.querySelector(".unit-price").value
    }))
  };
}

function saveDraft() {
  localStorage.setItem(storageKey, JSON.stringify({ ...collectData(), id: currentEditId }));
}

function restoreDraft() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    document.querySelector("#quote-date").valueAsDate = new Date();
    addRow();
    return;
  }
  try {
    const data = JSON.parse(saved);
    currentEditId = data.id || null;
    editingExisting = Boolean(currentEditId);
    for (const key of ["date", "customer", "taxId", "address", "seller", "terms"]) {
      if (data[key] !== undefined) document.querySelector(`#${key === "taxId" ? "tax-id" : key}`).value = data[key];
    }
    (data.items?.length ? data.items : [{}]).forEach(addRow);
    updateSubmitButton();
  } catch {
    localStorage.removeItem(storageKey);
    document.querySelector("#quote-date").valueAsDate = new Date();
    addRow();
  }
}

function getHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
    return Array.isArray(history) ? history : [];
  } catch {
    localStorage.removeItem(historyKey);
    return [];
  }
}

function saveToHistory() {
  const quote = collectData();
  const history = getHistory();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const savedQuote = { ...quote, id, savedAt: new Date().toISOString() };
  history.unshift(savedQuote);
  localStorage.setItem(historyKey, JSON.stringify(history));
  currentEditId = null;
  editingExisting = false;
  localStorage.setItem(storageKey, JSON.stringify({ ...quote, id: null }));
  updateSubmitButton();
  renderHistory();
}

function renderHistory() {
  const allHistory = getHistory()
    .filter(isWithinLastTwoYears)
    .sort((a, b) => getQuoteTimestamp(b) - getQuoteTimestamp(a));
  const search = historySearch.value.trim().toLocaleLowerCase("es");
  const matchingHistory = search
    ? allHistory.filter(quote => (quote.customer || "").toLocaleLowerCase("es").includes(search))
    : allHistory.slice(0, 5);
  historyList.replaceChildren();
  historyEmpty.hidden = matchingHistory.length > 0;
  historyCount.textContent = `${allHistory.length} ${allHistory.length === 1 ? "cotización" : "cotizaciones"}`;
  historySummary.textContent = search
    ? `${matchingHistory.length} resultado${matchingHistory.length === 1 ? "" : "s"} para "${historySearch.value.trim()}".`
    : `Mostrando las ${Math.min(5, allHistory.length)} más recientes de los últimos 2 años.`;
  matchingHistory.forEach(quote => {
    const entry = document.createElement("article");
    entry.className = "history-entry";
    const customer = quote.customer?.trim() || "Sin cliente";
    const date = formatDate(quote.date);
    const total = calculateQuoteTotal(quote);
    entry.innerHTML = `
      <div class="history-info">
        <p class="history-customer">${escapeHtml(customer)}</p>
        <p class="history-meta">${date} · ${money.format(total)}${quote.seller ? ` · Vendedor: ${escapeHtml(quote.seller)}` : ""}</p>
      </div>
      <div class="history-actions">
        <button class="button button-secondary edit-quote" type="button" data-id="${escapeHtml(quote.id)}">Editar</button>
        <button class="button button-danger delete-quote" type="button" data-id="${escapeHtml(quote.id)}">Eliminar</button>
      </div>
    `;
    historyList.append(entry);
  });
}

function getQuoteTimestamp(quote) {
  const date = quote.date ? new Date(`${quote.date}T00:00:00`) : new Date(quote.savedAt || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function isWithinLastTwoYears(quote) {
  const today = new Date();
  const limit = new Date(today);
  limit.setFullYear(today.getFullYear() - 2);
  const savedDate = new Date(quote.savedAt || 0);
  const quoteDate = quote.date || (Number.isNaN(savedDate.getTime()) ? "" : toDateKey(savedDate));
  const limitDate = toDateKey(limit);
  const todayDate = toDateKey(today);
  return quoteDate >= limitDate && quoteDate <= todayDate;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateQuoteTotal(quote) {
  return (quote.items || []).reduce((total, item) => {
    return total + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0);
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function updateSubmitButton() {
  submitButton.textContent = editingExisting ?"Generar cotización": "Generar cotización";
}

function loadQuote(id) {
  const quote = getHistory().find(item => item.id === id);
  if (!quote) return;
  currentEditId = quote.id;
  editingExisting = true;
  form.reset();
  itemsBody.replaceChildren();
  document.querySelector("#quote-date").value = quote.date || "";
  document.querySelector("#customer").value = quote.customer || "";
  document.querySelector("#tax-id").value = quote.taxId || "";
  document.querySelector("#address").value = quote.address || "";
  document.querySelector("#seller").value = quote.seller || "";
  document.querySelector("#terms").value = quote.terms || "";
  (quote.items?.length ? quote.items : [{}]).forEach(addRow);
  updateSubmitButton();
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("Cotización cargada para editar");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

function validateQuote() {
  form.querySelectorAll("input, textarea").forEach(field => field.setCustomValidity(""));
  const missingFields = [...form.querySelectorAll("input[required], textarea[required]")]
    .filter(field => !field.value.trim());
  missingFields.forEach(field => field.setCustomValidity("Completá este campo antes de generar la cotización."));

  if (!form.reportValidity()) {
    showToast("Completá todos los campos antes de generar la cotización.");
    missingFields[0]?.focus();
    return false;
  }
  return true;
}

document.querySelector("#add-row").addEventListener("click", () => addRow());
document.querySelector("#clear-form").addEventListener("click", () => {
  if (!window.confirm("¿Querés borrar los datos de esta cotización?")) return;
  localStorage.removeItem(storageKey);
  form.reset();
  itemsBody.replaceChildren();
  document.querySelector("#quote-date").valueAsDate = new Date();
  currentEditId = null;
  editingExisting = false;
  updateSubmitButton();
  addRow();
  showToast("Cotización limpiada");
});
historySearch.addEventListener("input", renderHistory);
historyList.addEventListener("click", event => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  const id = button.dataset.id;
  if (button.classList.contains("edit-quote")) {
    loadQuote(id);
    return;
  }
  if (button.classList.contains("delete-quote")) {
    if (!window.confirm("¿Querés eliminar esta cotización del historial?")) return;
    const remaining = getHistory().filter(quote => quote.id !== id);
    localStorage.setItem(historyKey, JSON.stringify(remaining));
    if (currentEditId === id) {
      currentEditId = null;
      editingExisting = false;
      updateSubmitButton();
    }
    renderHistory();
    showToast("Cotización eliminada");
  }
});
form.addEventListener("submit", event => {
  event.preventDefault();
  if (!validateQuote()) return;
  saveToHistory();
  saveDraft();
  window.print();
});

restoreDraft();
renderHistory();
