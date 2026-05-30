/* =============================================
   SRI Facturación Electrónica - Frontend SPA
   ============================================= */

// ─── State ───────────────────────────────────
const state = {
  token: null,
  user: null,
  company: null,
  clients: [],
  products: [],
  invoices: [],
  invoicePDFs: [],
};

// ─── DOM refs ────────────────────────────────
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

const loginScreen = $('#login-screen');
const appLayout = $('#app-layout');
const mainContent = $('#main-content');
const loginForm = $('#login-form');
const loginError = $('#login-error');
const btnLogin = $('#btn-login');
const pageTitle = $('#page-title');
const headerRuc = $('#header-ruc');
const sriEnv = $('#sri-env-badge');
const userName = $('#user-name');
const userEmail = $('#user-email');
const userAvatar = $('#user-avatar');

// ─── Toast ───────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3500);
}

// ─── API Client ──────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (state.token) opts.headers['Authorization'] = `Bearer ${state.token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
}

// ─── Auth ────────────────────────────────────
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  btnLogin.disabled = true;
  btnLogin.querySelector('span').textContent = 'Ingresando...';

  try {
    const data = await api('POST', '/auth', {
      email: $('#email').value,
      password: $('#password').value,
    });
    state.token = data.token;
    state.user = data.user || data;
    state.company = data.company || null;
    enterApp();
    toast('Sesión iniciada correctamente', 'success');
  } catch (err) {
    loginError.textContent = err.message || 'Error al iniciar sesión';
  } finally {
    btnLogin.disabled = false;
    btnLogin.querySelector('span').textContent = 'Ingresar al Sistema';
  }
});

$('#btn-logout').addEventListener('click', () => {
  state.token = null;
  state.user = null;
  state.company = null;
  appLayout.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  $('#email').value = '';
  $('#password').value = '';
  toast('Sesión cerrada', 'info');
});

function enterApp() {
  loginScreen.classList.add('hidden');
  appLayout.classList.remove('hidden');
  const c = state.company || {};
  headerRuc.textContent = c.ruc || '---';
  sriEnv.textContent = c.tipo_ambiente === 2 ? 'Producción' : 'Pruebas (Ambiente SRI)';
  userName.textContent = state.user?.email?.split('@')[0] || 'Usuario';
  userEmail.textContent = state.user?.email || '';
  userAvatar.textContent = (state.user?.email?.[0] || 'U').toUpperCase();
  navigate('#/dashboard');
}

// ─── Router ──────────────────────────────────
function navigate(hash) {
  if (!hash) hash = '#/dashboard';
  history.replaceState(null, '', hash);
  renderRoute(hash);
  updateSidebar(hash);
}

window.addEventListener('hashchange', () => {
  renderRoute(location.hash);
  updateSidebar(location.hash);
});

function updateSidebar(hash) {
  $$('.nav-link').forEach(a => {
    const route = a.dataset.route;
    const active = hash.includes(route);
    a.classList.toggle('active', active);
  });
}

// ─── Render Functions ────────────────────────

function renderRoute(hash) {
  if (hash.startsWith('#/dashboard')) renderDashboard();
  else if (hash.startsWith('#/invoice/new')) renderNewInvoice();
  else if (hash.startsWith('#/invoices')) renderInvoices();
  else if (hash.startsWith('#/clients')) renderClients();
  else if (hash.startsWith('#/products')) renderProducts();
  else renderDashboard();
}

function setPageTitle(title) {
  pageTitle.textContent = title;
}

// ─── Loading state ──────────────────────────
function showLoading() {
  mainContent.innerHTML = `
    <div class="flex items-center justify-center py-20">
      <div class="spinner"></div>
      <span class="ml-3 text-slate-400 text-sm">Cargando...</span>
    </div>`;
}

function showError(msg) {
  mainContent.innerHTML = `
    <div class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <i class="fas fa-exclamation-triangle text-red-400 text-xl"></i>
      </div>
      <p class="text-slate-300 font-medium">${msg}</p>
    </div>`;
}

// ═══════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════
async function renderDashboard() {
  setPageTitle('Dashboard');
  showLoading();
  try {
    const [invoices, clients, products] = await Promise.all([
      api('GET', '/api/v1/invoice').catch(() => []),
      api('GET', '/api/v1/client').catch(() => []),
      api('GET', '/api/v1/product').catch(() => []),
    ]);

    const invs = Array.isArray(invoices) ? invoices : [];
    const clis = Array.isArray(clients) ? clients : [];
    const prods = Array.isArray(products) ? products : [];

    const hoy = new Date().toLocaleDateString('es-EC');
    const hoyInvs = invs.filter(i => new Date(i.fecha_emision).toLocaleDateString('es-EC') === hoy);
    const recibidas = invs.filter(i => i.sri_estado === 'RECIBIDA');
    const totalValor = invs.reduce((s, i) => s + (parseFloat(i.total_con_impuestos) || 0), 0);

    mainContent.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="stat-card">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Facturas Hoy</span>
            <span class="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center"><i class="fas fa-file-invoice text-blue-400 text-sm"></i></span>
          </div>
          <p class="text-2xl font-bold text-white">${hoyInvs.length}</p>
          <p class="text-xs text-slate-500 mt-1">${invs.length} emitidas en total</p>
        </div>
        <div class="stat-card">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Aceptadas SRI</span>
            <span class="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center"><i class="fas fa-check-circle text-emerald-400 text-sm"></i></span>
          </div>
          <p class="text-2xl font-bold text-white">${recibidas.length}</p>
          <p class="text-xs text-slate-500 mt-1">${invs.length ? Math.round(recibidas.length / invs.length * 100) : 0}% de aceptación</p>
        </div>
        <div class="stat-card">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Clientes</span>
            <span class="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center"><i class="fas fa-users text-violet-400 text-sm"></i></span>
          </div>
          <p class="text-2xl font-bold text-white">${clis.length}</p>
          <p class="text-xs text-slate-500 mt-1">registrados</p>
        </div>
        <div class="stat-card">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Facturado</span>
            <span class="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center"><i class="fas fa-dollar-sign text-amber-400 text-sm"></i></span>
          </div>
          <p class="text-2xl font-bold text-white">$${totalValor.toFixed(2)}</p>
          <p class="text-xs text-slate-500 mt-1">valor acumulado</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent invoices -->
        <div class="content-card">
          <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700/40">
            <h3 class="text-sm font-semibold text-white">Últimas Facturas</h3>
            <a href="#/invoices" class="text-xs text-blue-400 hover:text-blue-300 transition">Ver todas <i class="fas fa-arrow-right ml-1"></i></a>
          </div>
          <div class="p-4">
            ${invs.length === 0 ? '<p class="text-slate-500 text-sm text-center py-6">No hay facturas aún</p>' :
              invs.slice(-5).reverse().map(i => `
                <div class="flex items-center justify-between py-2.5 border-b border-slate-700/20 last:border-0">
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-slate-200 truncate">#${i.secuencial || '---'}</p>
                    <p class="text-xs text-slate-500 truncate">${new Date(i.fecha_emision).toLocaleDateString('es-EC')}</p>
                  </div>
                  <span class="badge ${badgeClass(i.sri_estado)} ml-3">${i.sri_estado || 'PENDIENTE'}</span>
                </div>
              `).join('')}
          </div>
        </div>

        <!-- Quick actions -->
        <div class="content-card">
          <div class="px-5 py-4 border-b border-slate-700/40">
            <h3 class="text-sm font-semibold text-white">Acciones Rápidas</h3>
          </div>
          <div class="p-5 space-y-3">
            <a href="#/invoice/new" class="flex items-center gap-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition group">
              <span class="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center group-hover:scale-105 transition"><i class="fas fa-plus text-blue-400"></i></span>
              <div><p class="text-sm font-medium text-slate-200">Nueva Factura</p><p class="text-xs text-slate-500">Emitir un comprobante electrónico</p></div>
            </a>
            <a href="#/clients" class="flex items-center gap-4 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10 hover:bg-violet-500/10 transition group">
              <span class="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center group-hover:scale-105 transition"><i class="fas fa-user-plus text-violet-400"></i></span>
              <div><p class="text-sm font-medium text-slate-200">Gestionar Clientes</p><p class="text-xs text-slate-500">Administrar base de datos de clientes</p></div>
            </a>
            <a href="#/products" class="flex items-center gap-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition group">
              <span class="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center group-hover:scale-105 transition"><i class="fas fa-box text-amber-400"></i></span>
              <div><p class="text-sm font-medium text-slate-200">Gestionar Productos</p><p class="text-xs text-slate-500">Administrar catálogo de productos</p></div>
            </a>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    showError('Error al cargar dashboard: ' + err.message);
  }
}

function badgeClass(estado) {
  switch (estado) {
    case 'RECIBIDA': return 'badge-success';
    case 'DEVUELTA': return 'badge-error';
    case 'ERROR_FIRMA':
    case 'ERROR_PROCESO':
    case 'ERROR_COMUNICACION': return 'badge-error';
    case 'PENDIENTE': return 'badge-warning';
    default: return 'badge-neutral';
  }
}

// ═══════════════════════════════════════════════
//  NEW INVOICE
// ═══════════════════════════════════════════════
let invoiceItems = [];
let selectedClientId = null;

async function renderNewInvoice() {
  setPageTitle('Nueva Factura');
  showLoading();
  try {
    const [clients, products] = await Promise.all([
      api('GET', '/api/v1/client').catch(() => []),
      api('GET', '/api/v1/product').catch(() => []),
    ]);
    state.clients = Array.isArray(clients) ? clients : [];
    state.products = Array.isArray(products) ? products : [];

    if (invoiceItems.length === 0) {
      invoiceItems = [{ desc: '', cant: 1, precio: 0, tieneIva: true }];
    }

    renderInvoiceForm();
  } catch (err) {
    showError('Error al cargar datos: ' + err.message);
  }
}

function renderInvoiceForm() {
  const totalSinIva = invoiceItems.reduce((s, it) => s + it.cant * it.precio, 0);
  const iva = invoiceItems.reduce((s, it) => s + (it.tieneIva ? it.cant * it.precio * 0.12 : 0), 0);
  const total = totalSinIva + iva;

  const clientOpts = state.clients.map(c =>
    `<option value="${c._id}" data-ident="${c.identificacion}" data-razon="${c.razon_social}" data-dir="${c.direccion || ''}" data-email="${c.email || ''}">${c.identificacion} - ${c.razon_social}</option>`
  ).join('');

  const prodOpts = state.products.map(p =>
    `<option value="${p._id}" data-codigo="${p.codigo}" data-desc="${p.descripcion}" data-precio="${p.precio_unitario}" data-iva="${p.tiene_iva}">${p.codigo} - ${p.descripcion} ($${parseFloat(p.precio_unitario).toFixed(2)})</option>`
  ).join('');

  mainContent.innerHTML = `
    <form id="invoice-form" class="space-y-5">
      <!-- Client Section -->
      <div class="content-card">
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/40">
          <h3 class="text-sm font-semibold text-white"><i class="fas fa-user mr-2 text-blue-400"></i>Datos del Cliente</h3>
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" id="use-existing-client" checked class="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/30">
              Cliente existente
            </label>
          </div>
        </div>
        <div class="p-5" id="client-section">
          <div id="client-selector">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1.5">Seleccionar Cliente</label>
                <select id="client-select" class="form-input">
                  <option value="">-- Seleccionar --</option>
                  ${clientOpts}
                </select>
              </div>
              <div class="flex items-end">
                <button type="button" id="btn-new-client" class="btn-secondary text-xs py-2"><i class="fas fa-plus"></i> Nuevo Cliente</button>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" id="client-fields">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1.5">Identificación (RUC/Cédula)</label>
                <input type="text" id="cli-ident" class="form-input" placeholder="0999999999" required>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1.5">Razón Social</label>
                <input type="text" id="cli-name" class="form-input" placeholder="Consumidor Final" required>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1.5">Dirección</label>
                <input type="text" id="cli-dir" class="form-input" placeholder="Dirección">
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                <input type="email" id="cli-email" class="form-input" placeholder="cliente@ejemplo.com">
              </div>
            </div>
          </div>
          <div id="client-manual" class="hidden">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1.5">Identificación (RUC/Cédula)</label>
                <input type="text" id="cli-ident-manual" class="form-input" placeholder="0999999999">
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1.5">Razón Social</label>
                <input type="text" id="cli-name-manual" class="form-input" placeholder="Consumidor Final">
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1.5">Dirección</label>
                <input type="text" id="cli-dir-manual" class="form-input" placeholder="Dirección">
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                <input type="email" id="cli-email-manual" class="form-input" placeholder="cliente@ejemplo.com">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Products Section -->
      <div class="content-card">
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/40">
          <h3 class="text-sm font-semibold text-white"><i class="fas fa-box mr-2 text-amber-400"></i>Detalle de Productos / Servicios</h3>
          <button type="button" id="btn-add-item" class="btn-secondary text-xs py-1.5 px-3"><i class="fas fa-plus"></i> Agregar</button>
        </div>
        <div class="p-5 space-y-3" id="items-container"></div>
        <div class="px-5 py-4 border-t border-slate-700/40">
          <div class="flex justify-end">
            <div class="w-72 space-y-1.5 text-sm">
              <div class="flex justify-between text-slate-400"><span>Subtotal 12%:</span><span id="subtotal-display">$0.00</span></div>
              <div class="flex justify-between text-slate-400"><span>IVA 12%:</span><span id="iva-display">$0.00</span></div>
              <div class="flex justify-between text-white font-bold text-base border-t border-slate-700/40 pt-1.5 mt-1.5"><span>VALOR TOTAL:</span><span id="total-display">$0.00</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex items-center justify-end gap-3">
        <button type="button" onclick="navigate('#/invoices')" class="btn-secondary">Cancelar</button>
        <button type="submit" id="btn-submit-invoice" class="btn-primary">
          <i class="fas fa-paper-plane"></i>
          <span>Emitir Factura Electrónica</span>
        </button>
      </div>
      <p class="text-sm text-center min-h-[1.25rem]" id="invoice-status-msg"></p>
    </form>

    <!-- Result Modal -->
    <div id="invoice-result-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay hidden" onclick="closeResultModal(event)">
      <div class="modal-content w-full max-w-lg p-6" onclick="event.stopPropagation()">
        <div class="text-center mb-5">
          <div class="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
            <i class="fas fa-check-circle text-emerald-400 text-3xl"></i>
          </div>
          <h3 class="text-lg font-bold text-white">Factura Emitida Exitosamente</h3>
          <p class="text-sm text-slate-400 mt-1">El comprobante fue recibido por el SRI</p>
        </div>
        <div class="bg-slate-900/50 rounded-xl p-4 mb-5 space-y-2 text-sm" id="result-details">
          <div class="flex justify-between"><span class="text-slate-400">Clave de Acceso:</span><span class="text-slate-200 font-mono text-xs text-right max-w-[60%] break-all" id="result-clave">---</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Secuencial:</span><span class="text-slate-200" id="result-secuencial">---</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Estado SRI:</span><span class="badge badge-success" id="result-estado">RECIBIDA</span></div>
        </div>
        <div class="flex justify-center gap-3">
          <a href="#" id="result-pdf-link" target="_blank" class="btn-secondary hidden"><i class="fas fa-file-pdf"></i> Descargar PDF</a>
          <button type="button" onclick="closeResultModal()" class="btn-primary">Nueva Factura</button>
        </div>
      </div>
    </div>
  `;

  setupInvoiceForm();
}

function closeResultModal(e) {
  const modal = $('#invoice-result-modal');
  if (e && e.target !== modal) return;
  modal.classList.add('hidden');
  invoiceItems = [{ desc: '', cant: 1, precio: 0, tieneIva: true }];
  navigate('#/invoice/new');
}

function setupInvoiceForm() {
  const useExisting = $('#use-existing-client');
  const selector = $('#client-selector');
  const manual = $('#client-manual');

  useExisting.addEventListener('change', () => {
    selector.classList.toggle('hidden', !useExisting.checked);
    manual.classList.toggle('hidden', useExisting.checked);
  });

  $('#client-select').addEventListener('change', (e) => {
    const opt = e.target.selectedOptions[0];
    if (opt && opt.value) {
      $('#cli-ident').value = opt.dataset.ident || '';
      $('#cli-name').value = opt.dataset.razon || '';
      $('#cli-dir').value = opt.dataset.dir || '';
      $('#cli-email').value = opt.dataset.email || '';
      selectedClientId = opt.value;
    }
  });

  $('#btn-new-client').addEventListener('click', async () => {
    const ident = $('#cli-ident').value.trim();
    const name = $('#cli-name').value.trim();
    const dir = $('#cli-dir').value.trim();
    const email = $('#cli-email').value.trim();
    if (!ident || !name) { toast('Completa identificación y razón social', 'error'); return; }
    try {
      const tipoIdent = ident.length === 13 ? '04' : '05';
      const data = await api('POST', '/api/v1/client', {
        identificacion: ident, razon_social: name, direccion: dir || 'N/A', email: email || 'cliente@gmail.com',
        telefono: '0999999999', tipo_identificacion_id: tipoIdent,
      });
      state.clients.push(data);
      toast('Cliente creado: ' + name, 'success');
      $('#client-select').insertAdjacentHTML('beforeend', `<option value="${data._id}" data-ident="${data.identificacion}" data-razon="${data.razon_social}" data-dir="${data.direccion || ''}" data-email="${data.email || ''}">${data.identificacion} - ${data.razon_social}</option>`);
      $('#client-select').value = data._id;
      $('#client-select').dispatchEvent(new Event('change'));
    } catch (err) {
      toast('Error: ' + err.message, 'error');
    }
  });

  $('#btn-add-item').addEventListener('click', () => {
    invoiceItems.push({ desc: '', cant: 1, precio: 0, tieneIva: true });
    renderItems();
  });

  renderItems();
  setupInvoiceSubmit();
}

function renderItems() {
  const container = $('#items-container');
  const prodOpts = state.products.map(p =>
    `<option value="${p._id}" data-codigo="${p.codigo}" data-desc="${p.descripcion}" data-precio="${p.precio_unitario}" data-iva="${p.tiene_iva}">${p.codigo} - ${p.descripcion} ($${parseFloat(p.precio_unitario).toFixed(2)})</option>`
  ).join('');

  container.innerHTML = invoiceItems.map((item, idx) => `
    <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 item-row">
      <div class="flex-1 grid grid-cols-12 gap-2">
        <div class="col-span-5">
          <label class="text-[10px] font-medium text-slate-500 uppercase">Producto</label>
          <select class="form-input text-xs py-1.5 product-select" data-idx="${idx}">
            <option value="">-- Manual --</option>
            ${prodOpts}
          </select>
          <input type="text" class="form-input text-xs py-1.5 mt-1 product-desc" value="${item.desc}" placeholder="Descripción" data-idx="${idx}">
        </div>
        <div class="col-span-2">
          <label class="text-[10px] font-medium text-slate-500 uppercase">Cant.</label>
          <input type="number" class="form-input text-xs py-1.5 product-cant" value="${item.cant}" min="0.01" step="0.01" data-idx="${idx}">
        </div>
        <div class="col-span-2">
          <label class="text-[10px] font-medium text-slate-500 uppercase">P. Unit.</label>
          <input type="number" class="form-input text-xs py-1.5 product-precio" value="${item.precio}" min="0" step="0.01" data-idx="${idx}">
        </div>
        <div class="col-span-2">
          <label class="text-[10px] font-medium text-slate-500 uppercase">Subtotal</label>
          <p class="text-sm font-semibold text-slate-200 pt-1.5 item-subtotal">$${(item.cant * item.precio).toFixed(2)}</p>
        </div>
        <div class="col-span-1 flex items-end justify-center pb-1">
          <button type="button" class="text-slate-600 hover:text-red-400 transition p-1 ${invoiceItems.length === 1 ? 'invisible' : ''}" onclick="removeItem(${idx})">
            <i class="fas fa-trash-alt text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Attach events
  container.querySelectorAll('.product-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const opt = e.target.selectedOptions[0];
      if (opt && opt.value) {
        invoiceItems[idx].desc = opt.dataset.desc || '';
        invoiceItems[idx].precio = parseFloat(opt.dataset.precio) || 0;
        invoiceItems[idx].tieneIva = opt.dataset.iva === 'true';
        renderItems();
      }
    });
  });
  container.querySelectorAll('.product-desc').forEach(el => {
    el.addEventListener('input', (e) => { const idx = parseInt(e.target.dataset.idx); invoiceItems[idx].desc = e.target.value; updateTotals(); });
  });
  container.querySelectorAll('.product-cant').forEach(el => {
    el.addEventListener('input', (e) => { const idx = parseInt(e.target.dataset.idx); invoiceItems[idx].cant = parseFloat(e.target.value) || 0; updateTotals(); });
  });
  container.querySelectorAll('.product-precio').forEach(el => {
    el.addEventListener('input', (e) => { const idx = parseInt(e.target.dataset.idx); invoiceItems[idx].precio = parseFloat(e.target.value) || 0; updateTotals(); });
  });
  updateTotals();
}

function removeItem(idx) {
  invoiceItems.splice(idx, 1);
  renderItems();
}

function updateTotals() {
  const totalSinIva = invoiceItems.reduce((s, it) => s + it.cant * it.precio, 0);
  const iva = invoiceItems.reduce((s, it) => s + (it.tieneIva ? it.cant * it.precio * 0.12 : 0), 0);
  const total = totalSinIva + iva;
  const f = (n) => `$${n.toFixed(2)}`;
  const sd = $('#subtotal-display'); if (sd) sd.textContent = f(totalSinIva);
  const id = $('#iva-display'); if (id) id.textContent = f(iva);
  const td = $('#total-display'); if (td) td.textContent = f(total);
}

function setupInvoiceSubmit() {
  $('#invoice-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#btn-submit-invoice');
    const statusMsg = $('#invoice-status-msg');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Emitiendo...';
    statusMsg.textContent = '';

    try {
      // Validate items
      const validItems = invoiceItems.filter(it => it.desc && it.cant > 0 && it.precio > 0);
      if (validItems.length === 0) { throw new Error('Agrega al menos un producto con descripción, cantidad y precio'); }

      // Client data
      const useExisting = $('#use-existing-client').checked;
      let ident, name, dir, email;
      if (useExisting) {
        ident = $('#cli-ident').value.trim();
        name = $('#cli-name').value.trim();
        dir = $('#cli-dir').value.trim() || 'N/A';
        email = $('#cli-email').value.trim() || 'cliente@gmail.com';
        if (!selectedClientId && state.clients.length > 0) {
          // Try to find matching client by ident
          const found = state.clients.find(c => c.identificacion === ident);
          if (found) selectedClientId = found._id;
        }
      } else {
        ident = $('#cli-ident-manual').value.trim();
        name = $('#cli-name-manual').value.trim();
        dir = $('#cli-dir-manual').value.trim() || 'N/A';
        email = $('#cli-email-manual').value.trim() || 'cliente@gmail.com';
      }
      if (!ident || !name) throw new Error('Identificación y Razón Social del cliente son obligatorias');

      const tipoIdent = ident.length === 13 ? '04' : '05';

      const totalSinImpuestos = validItems.reduce((s, it) => s + it.cant * it.precio, 0);
      const iva = validItems.reduce((s, it) => s + (it.tieneIva ? it.cant * it.precio * 0.12 : 0), 0);
      const importeTotal = totalSinImpuestos + iva;

      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const formattedDate = `${dd}/${mm}/${yyyy}`;

      const payload = {
        factura: {
          infoTributaria: {
            ruc: state.company?.ruc || '0750687964001',
          },
          infoFactura: {
            fechaEmision: formattedDate,
            tipoIdentificacionComprador: tipoIdent,
            identificacionComprador: ident,
            razonSocialComprador: name,
            totalSinImpuestos: totalSinImpuestos.toFixed(2),
            importeTotal: importeTotal.toFixed(2),
          },
          detalles: validItems.map((it, i) => ({
            detalle: {
              codigoPrincipal: `P${String(i + 1).padStart(3, '0')}`,
              descripcion: it.desc,
              cantidad: it.cant.toFixed(2),
              precioUnitario: it.precio.toFixed(4),
              precioTotalSinImpuesto: (it.cant * it.precio).toFixed(2),
              impuestos: [{
                impuesto: {
                  codigo: '2',
                  codigoPorcentaje: '2',
                  tarifa: '12.00',
                  baseImponible: (it.cant * it.precio).toFixed(2),
                  valor: (it.tieneIva ? (it.cant * it.precio * 0.12) : 0).toFixed(2),
                },
              }],
            },
          })),
        },
      };

      statusMsg.innerHTML = '<span class="spinner inline-block mr-2"></span>Generando XML, firmando y enviando al SRI...';
      statusMsg.className = 'text-sm text-center text-slate-400';

      const data = await api('POST', '/api/v1/invoice/complete', payload);

      // Show result modal
      $('#result-clave').textContent = data.data?.factura?.clave_acceso || '---';
      $('#result-secuencial').textContent = data.data?.factura?.secuencial || '---';
      const modal = $('#invoice-result-modal');
      modal.classList.remove('hidden');

      // Try to get PDF link
      const facturaId = data.data?.factura?._id;
      if (facturaId) {
        setTimeout(async () => {
          try {
            const pdfData = await api('GET', `/api/v1/invoice-pdf/invoice/${facturaId}`).catch(() => null);
            if (pdfData && pdfData.pdf_url) {
              const link = $('#result-pdf-link');
              link.href = pdfData.pdf_url;
              link.classList.remove('hidden');
            }
          } catch (_) {}
        }, 2000);
      }

      toast('Factura #' + (data.data?.factura?.secuencial || '---') + ' emitida correctamente', 'success');
    } catch (err) {
      statusMsg.textContent = '❌ ' + (err.message || 'Error al emitir factura');
      statusMsg.className = 'text-sm text-center text-red-400';
      toast('Error: ' + (err.message || 'Error desconocido'), 'error');
    } finally {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Emitir Factura Electrónica';
    }
  });
}

// ═══════════════════════════════════════════════
//  INVOICES HISTORY
// ═══════════════════════════════════════════════
async function renderInvoices() {
  setPageTitle('Historial de Facturas');
  showLoading();
  try {
    const data = await api('GET', '/api/v1/invoice');
    const invs = Array.isArray(data) ? data : [];
    state.invoices = invs;

    const search = location.hash.includes('?q=') ? location.hash.split('?q=')[1] : '';
    const filtered = search ? invs.filter(i => (i.secuencial || '').includes(search) || (i.clave_acceso || '').includes(search)) : invs;

    mainContent.innerHTML = `
      <div class="content-card">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-700/40">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
            <input type="text" id="invoice-search" class="form-input text-xs py-1.5 pl-8 w-64" placeholder="Buscar por secuencial o clave..." value="${search}">
          </div>
          <a href="#/invoice/new" class="btn-primary text-xs py-1.5 px-3"><i class="fas fa-plus"></i> Nueva Factura</a>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Identificación</th>
                <th>Total</th>
                <th>Estado SRI</th>
                <th>Clave de Acceso</th>
                <th class="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ?
                `<tr><td colspan="8" class="text-center text-slate-500 py-10">${search ? 'No se encontraron resultados' : 'No hay facturas emitidas aún'}</td></tr>` :
                filtered.slice().reverse().map(i => `
                <tr>
                  <td class="font-mono font-medium text-slate-200">${i.secuencial || '---'}</td>
                  <td class="text-slate-400 whitespace-nowrap">${i.fecha_emision ? new Date(i.fecha_emision).toLocaleDateString('es-EC') : '---'}</td>
                  <td class="max-w-[140px] truncate" title="${i.cliente_id?.razon_social || '---'}">${i.cliente_id?.razon_social || '---'}</td>
                  <td class="text-slate-400 font-mono text-xs">${i.cliente_id?.identificacion || '---'}</td>
                  <td class="font-medium text-slate-200">$${parseFloat(i.total_con_impuestos || 0).toFixed(2)}</td>
                  <td><span class="badge ${badgeClass(i.sri_estado)}">${i.sri_estado || 'PENDIENTE'}</span></td>
                  <td class="font-mono text-[11px] text-slate-500 max-w-[180px] truncate" title="${i.clave_acceso || ''}">${i.clave_acceso ? i.clave_acceso.slice(0, 20) + '...' : '---'}</td>
                  <td class="text-right">
                    <button class="btn-secondary text-xs py-1 px-2.5 view-pdf-btn" data-factura-id="${i._id}" title="Ver PDF"><i class="fas fa-file-pdf text-blue-400"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    $('#invoice-search').addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (q) navigate('#/invoices?q=' + q);
      else navigate('#/invoices');
    });

    $$('.view-pdf-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const fid = btn.dataset.facturaId;
        try {
          const pdfData = await api('GET', `/api/v1/invoice-pdf/invoice/${fid}`);
          if (pdfData && pdfData.pdf_url) window.open(pdfData.pdf_url, '_blank');
          else toast('PDF aún no disponible', 'info');
        } catch {
          toast('PDF no encontrado para esta factura', 'info');
        }
      });
    });
  } catch (err) {
    showError('Error al cargar facturas: ' + err.message);
  }
}

// ═══════════════════════════════════════════════
//  CLIENTS
// ═══════════════════════════════════════════════
async function renderClients() {
  setPageTitle('Gestión de Clientes');
  showLoading();
  try {
    const data = await api('GET', '/api/v1/client');
    const clis = Array.isArray(data) ? data : [];
    state.clients = clis;

    mainContent.innerHTML = `
      <div class="content-card">
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/40">
          <h3 class="text-sm font-semibold text-white">${clis.length} Clientes Registrados</h3>
          <button id="btn-add-client" class="btn-primary text-xs py-1.5 px-3"><i class="fas fa-plus"></i> Nuevo Cliente</button>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr><th>Identificación</th><th>Razón Social</th><th>Dirección</th><th>Email</th><th>Teléfono</th><th class="text-right">Acciones</th></tr>
            </thead>
            <tbody>
              ${clis.length === 0 ?
                '<tr><td colspan="6" class="text-center text-slate-500 py-10">No hay clientes registrados</td></tr>' :
                clis.map(c => `
                <tr>
                  <td class="font-mono font-medium text-slate-200">${c.identificacion || '---'}</td>
                  <td>${c.razon_social || '---'}</td>
                  <td class="text-slate-400 max-w-[150px] truncate">${c.direccion || '---'}</td>
                  <td class="text-slate-400">${c.email || '---'}</td>
                  <td class="text-slate-400">${c.telefono || '---'}</td>
                  <td class="text-right">
                    <button class="btn-secondary text-xs py-1 px-2 edit-client-btn" data-id="${c._id}" data-ident="${c.identificacion}" data-name="${c.razon_social}" data-dir="${c.direccion || ''}" data-email="${c.email || ''}" data-tel="${c.telefono || ''}"><i class="fas fa-edit text-blue-400"></i></button>
                    <button class="btn-danger text-xs py-1 px-2 delete-client-btn" data-id="${c._id}"><i class="fas fa-trash-alt"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Add client
    $('#btn-add-client').addEventListener('click', () => showClientModal());
    // Edit
    $$('.edit-client-btn').forEach(b => b.addEventListener('click', () => showClientModal(b.dataset)));
    // Delete
    $$('.delete-client-btn').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este cliente?')) return;
      try {
        await api('DELETE', `/api/v1/client/${b.dataset.id}`);
        toast('Cliente eliminado', 'success');
        renderClients();
      } catch (err) { toast('Error: ' + err.message, 'error'); }
    }));
  } catch (err) { showError('Error: ' + err.message); }
}

function showClientModal(data) {
  const isEdit = !!data?.id;
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div class="modal-content w-full max-w-md p-6" onclick="event.stopPropagation()">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-base font-bold text-white">${isEdit ? 'Editar' : 'Nuevo'} Cliente</h3>
        <button class="text-slate-500 hover:text-white transition" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
      </div>
      <form id="client-form-modal" class="space-y-4">
        <input type="hidden" id="client-id" value="${data?.id || ''}">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Identificación (RUC/Cédula)</label>
          <input type="text" id="c-ident" class="form-input" value="${data?.ident || ''}" required>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Razón Social</label>
          <input type="text" id="c-name" class="form-input" value="${data?.name || ''}" required>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Dirección</label>
          <input type="text" id="c-dir" class="form-input" value="${data?.dir || ''}">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Email</label>
          <input type="email" id="c-email" class="form-input" value="${data?.email || ''}">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Teléfono</label>
          <input type="text" id="c-tel" class="form-input" value="${data?.tel || ''}">
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
          <button type="submit" class="btn-primary">${isEdit ? 'Actualizar' : 'Crear'} Cliente</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('#client-form-modal').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('#client-id', overlay).value;
    const body = {
      identificacion: $('#c-ident', overlay).value.trim(),
      razon_social: $('#c-name', overlay).value.trim(),
      direccion: $('#c-dir', overlay).value.trim() || 'N/A',
      email: $('#c-email', overlay).value.trim() || '',
      telefono: $('#c-tel', overlay).value.trim() || '',
    };
    try {
      if (id) {
        await api('PUT', `/api/v1/client/${id}`, body);
        toast('Cliente actualizado', 'success');
      } else {
        body.tipo_identificacion_id = body.identificacion.length === 13 ? '04' : '05';
        await api('POST', '/api/v1/client', body);
        toast('Cliente creado', 'success');
      }
      overlay.remove();
      renderClients();
    } catch (err) { toast('Error: ' + err.message, 'error'); }
  });
}

// ═══════════════════════════════════════════════
//  PRODUCTS
// ═══════════════════════════════════════════════
async function renderProducts() {
  setPageTitle('Gestión de Productos');
  showLoading();
  try {
    const data = await api('GET', '/api/v1/product');
    const prods = Array.isArray(data) ? data : [];
    state.products = prods;

    mainContent.innerHTML = `
      <div class="content-card">
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/40">
          <h3 class="text-sm font-semibold text-white">${prods.length} Productos/Servicios</h3>
          <button id="btn-add-product" class="btn-primary text-xs py-1.5 px-3"><i class="fas fa-plus"></i> Nuevo Producto</button>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr><th>Código</th><th>Descripción</th><th>Precio Unit.</th><th>IVA</th><th class="text-right">Acciones</th></tr>
            </thead>
            <tbody>
              ${prods.length === 0 ?
                '<tr><td colspan="5" class="text-center text-slate-500 py-10">No hay productos registrados</td></tr>' :
                prods.map(p => `
                <tr>
                  <td class="font-mono font-medium text-slate-200">${p.codigo || '---'}</td>
                  <td class="max-w-[250px] truncate">${p.descripcion || '---'}</td>
                  <td class="font-medium text-slate-200">$${parseFloat(p.precio_unitario || 0).toFixed(2)}</td>
                  <td>${p.tiene_iva ? '<span class="badge badge-info">IVA 12%</span>' : '<span class="badge badge-neutral">Exento</span>'}</td>
                  <td class="text-right">
                    <button class="btn-secondary text-xs py-1 px-2 edit-product-btn" data-id="${p._id}" data-codigo="${p.codigo}" data-desc="${p.descripcion}" data-precio="${p.precio_unitario}" data-iva="${p.tiene_iva}"><i class="fas fa-edit text-blue-400"></i></button>
                    <button class="btn-danger text-xs py-1 px-2 delete-product-btn" data-id="${p._id}"><i class="fas fa-trash-alt"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    $('#btn-add-product').addEventListener('click', () => showProductModal());
    $$('.edit-product-btn').forEach(b => b.addEventListener('click', () => showProductModal(b.dataset)));
    $$('.delete-product-btn').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este producto?')) return;
      try {
        await api('DELETE', `/api/v1/product/${b.dataset.id}`);
        toast('Producto eliminado', 'success');
        renderProducts();
      } catch (err) { toast('Error: ' + err.message, 'error'); }
    }));
  } catch (err) { showError('Error: ' + err.message); }
}

function showProductModal(data) {
  const isEdit = !!data?.id;
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div class="modal-content w-full max-w-md p-6" onclick="event.stopPropagation()">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-base font-bold text-white">${isEdit ? 'Editar' : 'Nuevo'} Producto</h3>
        <button class="text-slate-500 hover:text-white transition" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
      </div>
      <form id="product-form-modal" class="space-y-4">
        <input type="hidden" id="p-id" value="${data?.id || ''}">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Código</label>
          <input type="text" id="p-codigo" class="form-input" value="${data?.codigo || ''}" required>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Descripción</label>
          <input type="text" id="p-desc" class="form-input" value="${data?.desc || ''}" required>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Precio Unitario ($)</label>
          <input type="number" id="p-precio" class="form-input" value="${data?.precio || ''}" step="0.01" min="0" required>
        </div>
        <div>
          <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" id="p-iva" ${data?.iva === 'true' || !data ? 'checked' : ''} class="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/30">
            Grava IVA (12%)
          </label>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
          <button type="submit" class="btn-primary">${isEdit ? 'Actualizar' : 'Crear'} Producto</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('#product-form-modal').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('#p-id', overlay).value;
    const body = {
      codigo: $('#p-codigo', overlay).value.trim(),
      descripcion: $('#p-desc', overlay).value.trim(),
      precio_unitario: parseFloat($('#p-precio', overlay).value) || 0,
      tiene_iva: $('#p-iva', overlay).checked,
    };
    try {
      if (id) {
        await api('PUT', `/api/v1/product/${id}`, body);
        toast('Producto actualizado', 'success');
      } else {
        await api('POST', '/api/v1/product', body);
        toast('Producto creado', 'success');
      }
      overlay.remove();
      renderProducts();
    } catch (err) { toast('Error: ' + err.message, 'error'); }
  });
}

// ─── Sidebar Toggle (mobile) ─────────────────
function toggleSidebar() {
  const sidebar = $('#sidebar');
  const overlay = $('#sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('hidden');
}

$('#sidebar-toggle').addEventListener('click', toggleSidebar);

// ─── Init ────────────────────────────────────
