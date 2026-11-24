
const $ = id => document.getElementById(id);

let patients = JSON.parse(
  localStorage.getItem("wf_patients") || "[]"
);

function saveStorage() {
  localStorage.setItem("wf_patients", JSON.stringify(patients));
}

function nextId() {
  const highest = patients.reduce((max, p) => {
    const number = Number(p.id.replace("PAC-", "")) || 0;
    return Math.max(max, number);
  }, 0);

  return "PAC-" + String(highest + 1).padStart(4, "0");
}

function prepareForm() {
  $("patientId").value = nextId();
  $("fecha").value = new Date().toISOString().slice(0, 10);
}

function statusBadge(status) {
  const css = {
    Activo: "status-activo",
    Pendiente: "status-pendiente",
    Finalizado: "status-finalizado"
  };

  return `<span class="status ${css[status] || ""}">${status}</span>`;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function render() {
  $("totalPatients").textContent = patients.length;
  $("activePatients").textContent =
    patients.filter(p => p.estado === "Activo").length;
  $("pendingPatients").textContent =
    patients.filter(p => p.estado === "Pendiente").length;

  const recent = [...patients].reverse().slice(0, 5);

  $("recentTable").innerHTML = recent.length
    ? recent.map(p => `
      <tr>
        <td>${escapeHTML(p.id)}</td>
        <td>${escapeHTML(p.nombre)} ${escapeHTML(p.apellidos)}</td>
        <td>${escapeHTML(p.telefono)}</td>
        <td>${escapeHTML(p.fecha)}</td>
        <td>${statusBadge(p.estado)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="5">Todavía no hay pacientes registrados.</td></tr>`;

  renderPatients();
}

function renderPatients() {
  const query = $("searchInput").value.toLowerCase();

  const filtered = patients.filter(p =>
    [p.id, p.nombre, p.apellidos, p.dui, p.telefono]
      .some(value => String(value).toLowerCase().includes(query))
  );

  $("patientTable").innerHTML = filtered.length
    ? filtered.map(p => `
      <tr>
        <td>${escapeHTML(p.id)}</td>
        <td>${escapeHTML(p.nombre)} ${escapeHTML(p.apellidos)}</td>
        <td>${escapeHTML(p.dui)}</td>
        <td>${escapeHTML(p.telefono)}</td>
        <td>${escapeHTML(p.fecha)}</td>
        <td>${escapeHTML(p.medico)}</td>
        <td>${statusBadge(p.estado)}</td>
        <td>
          <button class="delete-btn" data-delete="${escapeHTML(p.id)}">
            Eliminar
          </button>
        </td>
      </tr>
    `).join("")
    : `<tr><td colspan="8">No se encontraron pacientes.</td></tr>`;

  $("tableCount").textContent =
    `${filtered.length} paciente(s) encontrado(s)`;
}

function showView(view) {
  document.querySelectorAll(".view").forEach(section => {
    section.classList.toggle("hidden", section.id !== view);
  });

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  $("sidebar").classList.remove("open");

  if (view === "register") prepareForm();
  if (view === "patients") renderPatients();
}

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.go));
});

$("menuToggle").addEventListener("click", () => {
  $("sidebar").classList.toggle("open");
});

$("patientForm").addEventListener("submit", event => {
  event.preventDefault();

  const patient = {
    id: $("patientId").value,
    nombre: $("nombre").value.trim(),
    apellidos: $("apellidos").value.trim(),
    dui: $("dui").value.trim(),
    telefono: $("telefono").value.trim(),
    direccion: $("direccion").value.trim(),
    ciudad: $("ciudad").value.trim(),
    fecha: $("fecha").value,
    medico: $("medico").value.trim(),
    procedimientos: $("procedimientos").value.trim(),
    estado: $("estado").value
  };

  patients.push(patient);
  saveStorage();
  render();

  alert("Paciente registrado correctamente.");

  $("patientForm").reset();
  prepareForm();
  showView("patients");
});

$("patientForm").addEventListener("reset", () => {
  setTimeout(prepareForm, 0);
});

$("searchInput").addEventListener("input", renderPatients);

$("patientTable").addEventListener("click", event => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;

  const id = button.dataset.delete;

  if (!confirm("¿Desea eliminar este registro?")) return;

  patients = patients.filter(p => p.id !== id);
  saveStorage();
  render();
});

$("exportBtn").addEventListener("click", () => {
  if (!patients.length) {
    alert("No hay pacientes para exportar.");
    return;
  }

  const columns = [
    "ID", "Nombre", "Apellidos", "DUI", "Telefono",
    "Direccion", "Ciudad", "Fecha", "Medico",
    "Procedimientos", "Estado"
  ];

  const keys = [
    "id", "nombre", "apellidos", "dui", "telefono",
    "direccion", "ciudad", "fecha", "medico",
    "procedimientos", "estado"
  ];

  const quote = value =>
    '"' + String(value ?? "").replace(/"/g, '""') + '"';

  const csv = [
    columns.map(quote).join(","),
    ...patients.map(p => keys.map(key => quote(p[key])).join(","))
  ].join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "pacientes_clinica_dental.csv";
  link.click();

  URL.revokeObjectURL(url);
});

$("today").textContent = new Date().toLocaleDateString("es-SV", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
});

prepareForm();
render();

