const itemsBody = document.querySelector("#items-body");
const grandTotal = document.querySelector("#grand-total");
const form = document.querySelector("#quote-form");
const toast = document.querySelector("#toast");
const storageKey = "dayplas-cotizacion";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 });

function addRow(item = {}) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input class="quantity" type="number" min="0" step="any" value="${item.quantity ?? ""}" placeholder="0" aria-label="Cantidad"></td>
    <td><input class="detail" type="text" value="${escapeHtml(item.detail ?? "")}" placeholder="Producto o servicio" aria-label="Detalle"></td>
    <td><input class="unit-price" type="number" min="0" step="0.01" value="${item.unitPrice ?? ""}" placeholder="0,00" aria-label="Precio unitario final con IVA"></td>
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
  localStorage.setItem(storageKey, JSON.stringify(collectData()));
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
    for (const key of ["date", "customer", "taxId", "address", "seller", "terms"]) {
      if (data[key] !== undefined) document.querySelector(`#${key === "taxId" ? "tax-id" : key}`).value = data[key];
    }
    (data.items?.length ? data.items : [{}]).forEach(addRow);
  } catch {
    localStorage.removeItem(storageKey);
    document.querySelector("#quote-date").valueAsDate = new Date();
    addRow();
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

document.querySelector("#add-row").addEventListener("click", () => addRow());
document.querySelector("#clear-form").addEventListener("click", () => {
  if (!window.confirm("¿Querés borrar los datos de esta cotización?")) return;
  localStorage.removeItem(storageKey);
  form.reset();
  itemsBody.replaceChildren();
  document.querySelector("#quote-date").valueAsDate = new Date();
  addRow();
  showToast("Cotización limpiada");
});
form.addEventListener("submit", event => {
  event.preventDefault();
  saveDraft();
  window.print();
});

restoreDraft();
