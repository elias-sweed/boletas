import { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const CONCEPTOS = [
  { id: "cert_estudios", label: "Certificado de Estudios", col: 0 },
  { id: "cert_conducta", label: "Certificado de Buena Conducta", col: 0 },
  { id: "const_matricula", label: "Constancia de Matrícula", col: 0 },
  { id: "const_estudios", label: "Constancia de Estudios", col: 0 },
  { id: "exoneracion", label: "Exoneración", col: 0 },
  { id: "actas", label: "Actas", col: 0 },
  { id: "otros", label: "Otros", col: 0, hasText: true },
  { id: "subsanacion", label: "Curso de Subsanación", col: 1 },
  { id: "curso_cargo", label: "Curso a Cargo", col: 1 },
  { id: "aplazado", label: "Curso de Aplazado", col: 1 },
  { id: "tramite", label: "Trámite Documentario", col: 1 },
  { id: "refuerzo", label: "Refuerzo Escolar", col: 1 },
  { id: "fut", label: "Solicitud (F.U.T.)", col: 1 },
  { id: "pra", label: "PRA", col: 1 },
];

const emptyRecibo = {
  numero: "",
  destinatario: "",
  monto: "",
  montoLetras: "",
  conceptos: {},
  otrosTexto: "",
  fecha: new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }),
  fechaISO: new Date().toISOString().split("T")[0],
};

export default function App() {
  const [recibos, setRecibos] = useState(() => {
    const saved = localStorage.getItem("jp_recibos");
    return saved ? JSON.parse(saved) : [];
  });
  const [nextId, setNextId] = useState(4);
  const [nextNum, setNextNum] = useState(16304);
  const [modal, setModal] = useState(null);
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState(emptyRecibo);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [printData, setPrintData] = useState(null);

  // Sincronizar recibos con localStorage (limpiado, solo se necesita una vez)
  useEffect(() => {
    localStorage.setItem("jp_recibos", JSON.stringify(recibos));
  }, [recibos]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = recibos.filter(r =>
    r.numero.includes(search) ||
    r.destinatario.toLowerCase().includes(search.toLowerCase()) ||
    Object.entries(r.conceptos).some(([k, v]) => v && CONCEPTOS.find(c => c.id === k)?.label.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => {
    setForm({ ...emptyRecibo, numero: String(nextNum).padStart(6, "0") });
    setModal("create");
  };
  const openEdit = (r) => { setCurrent(r); setForm({ ...r, conceptos: { ...r.conceptos } }); setModal("edit"); };
  const openView = (r) => { setCurrent(r); setModal("view"); };
  const openDelete = (r) => { setCurrent(r); setModal("delete"); };
  const openPrint = (r) => { setPrintData(r); setModal("print"); };

  const handleSave = () => {
    if (modal === "create") {
      setRecibos(p => [...p, { ...form, id: nextId }]);
      setNextId(n => n + 1);
      setNextNum(n => n + 1);
      showToast("Recibo creado exitosamente");
    } else {
      setRecibos(p => p.map(r => r.id === current.id ? { ...form, id: current.id } : r));
      showToast("Recibo actualizado");
    }
    setModal(null);
  };

  const handleDelete = () => {
    setRecibos(p => p.filter(r => r.id !== current.id));
    showToast("Recibo eliminado", "err");
    setModal(null);
  };

  const toggleConcepto = (id) => setForm(f => ({ ...f, conceptos: { ...f.conceptos, [id]: !f.conceptos[id] } }));

  // NUEVA FUNCIÓN: Generar PDF
  const handleDownloadPDF = async (numeroRecibo) => {
    const element = document.getElementById("recibo-documento");
    if (!element) return;

    try {
      showToast("Generando PDF...");
      // Aumentamos la escala para mejor calidad de impresión
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      // Calculamos la altura proporcional para evitar distorsión
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Recibo_N${numeroRecibo}.pdf`);
      showToast("PDF descargado correctamente");
    } catch (error) {
      console.error("Error al generar PDF: ", error);
      showToast("Hubo un error al generar el PDF", "err");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f0e8; }
        :root {
          --navy: #1a2744;
          --gold: #c8a84b;
          --gold-light: #e8d5a3;
          --cream: #faf7f0;
          --ink: #1c1c2e;
          --mid: #5a5a72;
          --border: #d4c9a8;
        }
        .app { min-height: 100vh; background: #f0ebe0; font-family: 'EB Garamond', Georgia, serif; color: var(--ink); }
        
        /* HEADER */
        .app-header {
          background: var(--navy);
          color: white;
          padding: 0;
          position: relative;
          overflow: hidden;
        }
        .app-header::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            45deg, transparent, transparent 30px,
            rgba(200,168,75,0.04) 30px, rgba(200,168,75,0.04) 31px
          );
        }
        .header-inner {
          max-width: 1100px; margin: 0 auto; padding: 28px 24px;
          display: flex; align-items: center; gap: 24px;
          position: relative; z-index: 1;
        }
        .seal {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--gold);
          display: flex; align-items: center; justify-content: center;
          font-size: 32px; flex-shrink: 0;
          box-shadow: 0 0 0 4px rgba(200,168,75,0.3), 0 0 0 8px rgba(200,168,75,0.1);
        }
        .header-text h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(14px, 2vw, 20px);
          font-weight: 900; letter-spacing: 0.5px;
          line-height: 1.2; text-transform: uppercase;
        }
        .header-text p {
          font-size: 12px; color: var(--gold-light); margin-top: 4px;
          letter-spacing: 1px;
        }
        .header-text .ruc {
          display: inline-block; margin-top: 6px;
          background: rgba(200,168,75,0.2); border: 1px solid var(--gold);
          padding: 2px 10px; font-size: 11px; letter-spacing: 2px; color: var(--gold);
        }
        .gold-bar { height: 4px; background: linear-gradient(90deg, var(--gold), #f0d080, var(--gold)); }

        /* CONTENT */
        .content { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }

        /* STATS */
        .stats { display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
        .stat-card {
          background: white; border: 1px solid var(--border);
          padding: 16px 24px; flex: 1; min-width: 140px;
          border-top: 3px solid var(--gold);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .stat-card .num {
          font-family: 'Playfair Display', serif;
          font-size: 28px; font-weight: 900; color: var(--navy);
          line-height: 1;
        }
        .stat-card .lbl { font-size: 11px; color: var(--mid); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }

        /* CONTROLS */
        .controls { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
        .search-wrap { position: relative; flex: 1; min-width: 220px; }
        .search-wrap input {
          width: 100%; padding: 10px 14px 10px 38px;
          border: 1.5px solid var(--border); background: white;
          font-family: 'EB Garamond', serif; font-size: 15px; color: var(--ink);
          outline: none; transition: border-color 0.2s;
        }
        .search-wrap input:focus { border-color: var(--navy); }
        .search-wrap .icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--mid); font-size: 14px; }
        .btn-primary {
          background: var(--navy); color: white;
          border: none; padding: 10px 22px;
          font-family: 'EB Garamond', serif; font-size: 15px;
          cursor: pointer; letter-spacing: 0.5px;
          border-bottom: 3px solid var(--gold);
          transition: opacity 0.2s;
        }
        .btn-primary:hover { opacity: 0.9; }

        /* TABLE */
        .table-wrap { background: white; border: 1px solid var(--border); box-shadow: 0 2px 12px rgba(0,0,0,0.07); overflow: hidden; }
        .table-head {
          background: var(--navy); color: white;
          display: grid; grid-template-columns: 100px 1fr 1fr 80px 120px 130px;
          padding: 12px 20px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
          font-family: 'EB Garamond', serif;
        }
        .table-head span:last-child { text-align: center; }
        .table-row {
          display: grid; grid-template-columns: 100px 1fr 1fr 80px 120px 130px;
          padding: 14px 20px; border-bottom: 1px solid var(--border);
          align-items: center; transition: background 0.15s;
          font-size: 15px;
        }
        .table-row:hover { background: #fdf9f0; }
        .table-row:last-child { border-bottom: none; }
        .recibo-num { font-family: 'Playfair Display', serif; font-weight: 700; color: var(--navy); font-size: 14px; }
        .concepto-tag {
          display: inline-block; background: #eef2f8; color: var(--navy);
          font-size: 11px; padding: 2px 8px; margin: 2px;
          border: 1px solid #c5d0e6;
        }
        .monto-cell { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 16px; color: #2a7a2a; }
        .fecha-cell { font-size: 13px; color: var(--mid); }
        .actions { display: flex; gap: 6px; justify-content: center; }
        .act-btn {
          width: 30px; height: 30px; border: 1px solid;
          cursor: pointer; font-size: 13px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; background: white;
        }
        .act-btn:hover { transform: translateY(-1px); }
        .btn-view { border-color: var(--navy); color: var(--navy); }
        .btn-view:hover { background: var(--navy); color: white; }
        .btn-edit { border-color: #2563eb; color: #2563eb; }
        .btn-edit:hover { background: #2563eb; color: white; }
        .btn-print { border-color: #16a34a; color: #16a34a; }
        .btn-print:hover { background: #16a34a; color: white; }
        .btn-del { border-color: #dc2626; color: #dc2626; }
        .btn-del:hover { background: #dc2626; color: white; }
        .empty { padding: 60px; text-align: center; color: var(--mid); font-style: italic; font-size: 17px; }

        /* MODAL */
        .overlay {
          position: fixed; inset: 0; background: rgba(26,39,68,0.65);
          z-index: 1000; display: flex; align-items: center; justify-content: center;
          padding: 16px; backdrop-filter: blur(2px);
        }
        .modal {
          background: var(--cream); max-height: 90vh; overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          border-top: 4px solid var(--gold); position: relative;
          animation: fadeUp 0.25s ease;
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        .modal-header {
          background: var(--navy); color: white; padding: 20px 28px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .modal-header h2 { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; }
        .modal-header button { background: none; border: none; color: white; font-size: 20px; cursor: pointer; opacity: 0.7; }
        .modal-header button:hover { opacity: 1; }
        .modal-body { padding: 28px; }
        .field-group { margin-bottom: 18px; }
        .field-label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--mid); margin-bottom: 6px; display: block; }
        .field-input {
          width: 100%; padding: 9px 13px;
          border: 1.5px solid var(--border); background: white;
          font-family: 'EB Garamond', serif; font-size: 15px; color: var(--ink);
          outline: none;
        }
        .field-input:focus { border-color: var(--navy); }
        .row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .section-title {
          font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700;
          color: var(--navy); padding-bottom: 8px; margin-bottom: 14px;
          border-bottom: 2px solid var(--gold);
        }
        .conceptos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .concepto-check {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 8px 10px; border: 1.5px solid transparent;
          cursor: pointer; transition: all 0.15s; font-size: 14px;
        }
        .concepto-check.active { background: #eef2f8; border-color: #c5d0e6; }
        .concepto-check input { accent-color: var(--navy); width: 15px; height: 15px; margin-top: 2px; flex-shrink: 0; }
        .otros-input { margin-top: 6px; width: 100%; padding: 6px 10px; border: 1px solid var(--border); font-family: 'EB Garamond', serif; font-size: 14px; }
        .modal-footer { display: flex; gap: 12px; justify-content: flex-end; padding: 0 28px 28px; }
        .btn-cancel { background: white; border: 1.5px solid var(--border); color: var(--mid); padding: 9px 22px; font-family: 'EB Garamond', serif; font-size: 15px; cursor: pointer; }
        .btn-save { background: var(--navy); color: white; border: none; border-bottom: 3px solid var(--gold); padding: 9px 28px; font-family: 'EB Garamond', serif; font-size: 15px; cursor: pointer; }
        .btn-danger { background: #dc2626; color: white; border: none; padding: 9px 22px; font-family: 'EB Garamond', serif; font-size: 15px; cursor: pointer; }

        /* PRINT MODAL / PDF AREA */
        .recibo-print {
          width: min(560px, 95vw); background: white;
          font-family: 'EB Garamond', Georgia, serif;
        }
        .rp-header { background: var(--navy); color: white; padding: 20px 24px; display: flex; gap: 16px; align-items: center; }
        .rp-seal { width: 56px; height: 56px; border-radius: 50%; background: var(--gold); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
        .rp-inst h3 { font-family: 'Playfair Display', serif; font-size: 12px; font-weight: 900; text-transform: uppercase; line-height: 1.3; }
        .rp-inst p { font-size: 10px; color: var(--gold-light); margin-top: 3px; }
        .rp-gold { height: 3px; background: linear-gradient(90deg, var(--gold), #f0d080, var(--gold)); }
        .rp-body { padding: 20px 24px; }
        .rp-title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .rp-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 900; color: var(--navy); letter-spacing: 3px; }
        .rp-num-box { text-align: right; }
        .rp-num-box .label { font-size: 10px; color: var(--mid); letter-spacing: 1px; }
        .rp-num-box .num { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 900; color: var(--navy); }
        .rp-amount-box { background: #f0f4fa; border-left: 4px solid var(--gold); padding: 10px 14px; margin-bottom: 18px; display: flex; gap: 16px; align-items: center; }
        .rp-amount-box .big { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 900; color: #2a7a2a; }
        .rp-amount-box .words { font-style: italic; font-size: 13px; color: var(--mid); }
        .rp-field { margin-bottom: 14px; }
        .rp-field .lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--mid); }
        .rp-field .val { font-size: 16px; color: var(--ink); border-bottom: 1px dotted var(--border); padding-bottom: 4px; margin-top: 3px; }
        .rp-conceptos-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--mid); margin-bottom: 10px; }
        .rp-conceptos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 16px; }
        .rp-item { display: flex; gap: 6px; align-items: center; font-size: 13px; padding: 5px 8px; }
        .rp-item.checked { background: #eef2f8; border: 1px solid #c5d0e6; color: var(--navy); font-weight: 600; }
        .rp-item.unchecked { color: #bbb; }
        .rp-box { width: 12px; height: 12px; border: 1.5px solid; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 9px; }
        .rp-footer { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 16px 24px; border-top: 1px solid var(--border); margin-top: 8px; }
        .rp-sig { text-align: center; }
        .rp-sig .line { width: 120px; height: 1px; background: var(--navy); margin: 40px auto 6px; }
        .rp-sig .label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--mid); }
        .rp-date { text-align: right; font-size: 14px; color: var(--mid); padding-top: 8px; font-style: italic; }
        .rp-watermark { text-align: center; padding: 8px; font-size: 10px; color: #ccc; letter-spacing: 3px; text-transform: uppercase; border-top: 1px solid var(--border); }
        .print-actions { display: flex; gap: 10px; justify-content: flex-end; padding: 16px 24px; background: var(--cream); border-top: 1px solid var(--border); }

        /* TOAST */
        .toast {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          background: var(--navy); color: white; padding: 14px 20px;
          font-family: 'EB Garamond', serif; font-size: 15px;
          border-left: 4px solid var(--gold); box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          animation: slideUp 0.3s ease;
        }
        .toast.err { border-left-color: #dc2626; }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }

        @media print {
  /* 1. Oculta todo el contenido de la página manteniendo la estructura */
  body * {
    visibility: hidden;
  }
  
  /* 2. Hace visible únicamente el modal de impresión y todo lo que esté dentro */
  .recibo-print, .recibo-print * {
    visibility: visible;
  }
  
  /* 3. Posiciona el recibo exactamente en la esquina superior para imprimir */
  .recibo-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    box-shadow: none;
    border: none;
  }
  
  /* 4. Oculta explícitamente los botones de acción para que no salgan en el papel */
  .print-actions, .print-actions * {
    display: none !important;
    visibility: hidden !important;
  }
}
      `}</style>

      <div className="app">
        {/* HEADER */}
        <header className="app-header">
          <div className="header-inner">
            <div className="seal">🏫</div>
            <div className="header-text">
              <h1>Institución Educativa Emblemática<br />"Jiménez Pimentel"</h1>
              <p>Jr. Orellana N° 3ra. Cuadra — Tarapoto</p>
              <span className="ruc">R.U.C. 20285268142</span>
            </div>
          </div>
        </header>
        <div className="gold-bar" />

        <div className="content">
          {/* STATS */}
          <div className="stats">
            <div className="stat-card">
              <div className="num">{recibos.length}</div>
              <div className="lbl">Total Recibos</div>
            </div>
            <div className="stat-card">
              <div className="num">S/. {recibos.reduce((s, r) => s + parseFloat(r.monto || 0), 0).toFixed(2)}</div>
              <div className="lbl">Recaudado Total</div>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="controls">
            <div className="search-wrap">
              <span className="icon">🔍</span>
              <input placeholder="Buscar por número, alumno o concepto…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={openCreate}>＋ Nuevo Recibo</button>
          </div>

          {/* TABLE */}
          <div className="table-wrap">
            <div className="table-head">
              <span>N° Recibo</span>
              <span>Destinatario</span>
              <span>Conceptos</span>
              <span>Fecha</span>
              <span>Monto</span>
              <span style={{ textAlign: "center" }}>Acciones</span>
            </div>
            {filtered.length === 0 ? (
              <div className="empty">No se encontraron recibos.</div>
            ) : filtered.map(r => (
              <div className="table-row" key={r.id}>
                <span className="recibo-num">N° {r.numero}</span>
                <span>{r.destinatario}</span>
                <span className="concepto-list">
                  {CONCEPTOS.filter(c => r.conceptos[c.id]).slice(0, 2).map(c => (
                    <span key={c.id} className="concepto-tag">{c.label.length > 20 ? c.label.slice(0, 18) + "…" : c.label}</span>
                  ))}
                  {CONCEPTOS.filter(c => r.conceptos[c.id]).length > 2 && <span className="concepto-tag">+{CONCEPTOS.filter(c => r.conceptos[c.id]).length - 2}</span>}
                </span>
                <span className="fecha-cell">{r.fecha}</span>
                <span className="monto-cell">S/. {parseFloat(r.monto || 0).toFixed(2)}</span>
                <div className="actions">
                  <button className="act-btn btn-view" onClick={() => openView(r)} title="Ver">👁</button>
                  <button className="act-btn btn-edit" onClick={() => openEdit(r)} title="Editar">✎</button>
                  <button className="act-btn btn-print" onClick={() => openPrint(r)} title="Imprimir">🖨</button>
                  <button className="act-btn btn-del" onClick={() => openDelete(r)} title="Eliminar">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOAST */}
        {toast && <div className={`toast ${toast.type === "err" ? "err" : ""}`}>{toast.type === "err" ? "✕" : "✓"} {toast.msg}</div>}

        {/* CREATE / EDIT MODAL */}
        {(modal === "create" || modal === "edit") && (
          <div className="overlay" onClick={() => setModal(null)}>
            <div className="modal" style={{ width: "min(660px, 95vw)" }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{modal === "create" ? "Nuevo Recibo" : "Editar Recibo"}</h2>
                <button onClick={() => setModal(null)}>✕</button>
              </div>
              <div className="modal-body">
                {/* Formulario Omitido por Brevedad, lo dejo exacto como estaba */}
                <div className="row-3" style={{ marginBottom: 18 }}>
                  <div className="field-group">
                    <label className="field-label">N° Recibo</label>
                    <input className="field-input" value={form.numero}  onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Monto S/.</label>
                    <input className="field-input" type="number" step="0.50" value={form.monto}
                      onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Fecha</label>
                    <input className="field-input" type="date" value={form.fechaISO}
                      onChange={e => {
                        const d = new Date(e.target.value + "T12:00:00");
                        const fechaStr = d.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
                        setForm(f => ({ ...f, fechaISO: e.target.value, fecha: fechaStr }));
                      }} />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Recibi del Sr.(a):</label>
                  <input className="field-input" value={form.destinatario}
                    onChange={e => setForm(f => ({ ...f, destinatario: e.target.value }))}
                    placeholder="Nombre completo del destinatario" />
                </div>
                <div className="field-group">
                  <label className="field-label">La suma de (en letras):</label>
                  <input className="field-input" value={form.montoLetras}
                    onChange={e => setForm(f => ({ ...f, montoLetras: e.target.value }))}
                    placeholder="Ej: Siete con 50/100 Soles" />
                </div>

                <div className="section-title">Concepto de Pago</div>
                <div className="conceptos-grid">
                  {CONCEPTOS.map(c => (
                    <label key={c.id} className={`concepto-check ${form.conceptos[c.id] ? "active" : ""}`}>
                      <input type="checkbox" checked={!!form.conceptos[c.id]} onChange={() => toggleConcepto(c.id)} />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
                {form.conceptos.otros && (
                  <div style={{ marginTop: 10 }}>
                    <input className="otros-input field-input" placeholder="Especifique el concepto…"
                      value={form.otrosTexto} onChange={e => setForm(f => ({ ...f, otrosTexto: e.target.value }))} />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
                <button className="btn-save" onClick={handleSave}>
                  {modal === "create" ? "Crear Recibo" : "Guardar Cambios"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {modal === "view" && current && (
          <div className="overlay" onClick={() => setModal(null)}>
            <div className="modal recibo-print" onClick={e => e.stopPropagation()}>
              {/* Contenedor envolvente (wrapper) con el ID necesario para html2canvas */}
              <div id="recibo-documento">
                <ReciboView r={current} />
              </div>
              <div className="print-actions">
                <button className="btn-cancel" onClick={() => setModal(null)}>Cerrar</button>
                {/* BOTÓN NUEVO: Descargar PDF */}
                <button className="btn-save" style={{ background: "#2563eb", borderColor: "#1d4ed8" }} onClick={() => handleDownloadPDF(current.numero)}>⬇ PDF</button>
                <button className="btn-save" style={{ background: "#16a34a", borderColor: "#0d5c1f" }} onClick={() => { setModal(null); setTimeout(() => openPrint(current), 100); }}>🖨 Imprimir</button>
                <button className="btn-save" onClick={() => { setModal(null); setTimeout(() => openEdit(current), 100); }}>✎ Editar</button>
              </div>
            </div>
          </div>
        )}

        {/* PRINT MODAL */}
        {modal === "print" && printData && (
          <div className="overlay" onClick={() => setModal(null)}>
            <div className="modal recibo-print" onClick={e => e.stopPropagation()}>
              {/* Contenedor envolvente con el ID */}
              <div id="recibo-documento">
                <ReciboView r={printData} />
              </div>
              <div className="print-actions">
                <button className="btn-cancel" onClick={() => setModal(null)}>Cerrar</button>
                {/* BOTÓN NUEVO: Descargar PDF */}
                <button className="btn-save" style={{ background: "#2563eb", borderColor: "#1d4ed8" }} onClick={() => handleDownloadPDF(printData.numero)}>⬇ PDF</button>
                <button className="btn-save" style={{ background: "#16a34a", borderColor: "#0d5c1f" }} onClick={() => window.print()}>🖨 Imprimir</button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {modal === "delete" && current && (
          <div className="overlay" onClick={() => setModal(null)}>
             <div className="modal delete-modal" onClick={e => e.stopPropagation()}>
               {/* Contenido omitido por brevedad, igual al original */}
              <div className="modal-header" style={{ background: "#dc2626" }}>
                <h2>Eliminar Recibo</h2>
                <button onClick={() => setModal(null)}>✕</button>
              </div>
              <div className="modal-body" style={{ textAlign: "center" }}>
                <div className="delete-icon">⚠️</div>
                <p style={{ fontSize: 16, color: "var(--ink)", marginBottom: 8 }}>
                  ¿Eliminar el recibo <strong>N° {current.numero}</strong>?
                </p>
                <p style={{ fontSize: 14, color: "var(--mid)" }}>
                  Destinatario: {current.destinatario}<br />
                  Monto: S/. {parseFloat(current.monto || 0).toFixed(2)}<br />
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
                <button className="btn-danger" onClick={handleDelete}>Eliminar Definitivamente</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Componente para pintar el contenido del recibo
function ReciboView({ r }) {
  return (
    <>
      <div className="rp-header">
        <div className="rp-seal">🏫</div>
        <div className="rp-inst">
          <h3>Institución Educativa Emblemática<br />"Jiménez Pimentel"</h3>
          <p>Jr. Orellana N° 3ra. Cuadra — Tarapoto &nbsp;|&nbsp; R.U.C. 20285268142</p>
        </div>
      </div>
      <div className="rp-gold" />
      <div className="rp-body">
        <div className="rp-title-row">
          <div className="rp-title">RECIBO</div>
          <div className="rp-num-box">
            <div className="label">N° DE RECIBO</div>
            <div className="num">{r.numero}</div>
            <div className="label" style={{ marginTop: 4 }}>Por S/.</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 900, color: "#2a7a2a" }}>{parseFloat(r.monto || 0).toFixed(2)}</div>
          </div>
        </div>

        <div className="rp-field">
          <div className="lbl">Recibí del Sr.(a):</div>
          <div className="val">{r.destinatario}</div>
        </div>
        <div className="rp-field">
          <div className="lbl">La suma de:</div>
          <div className="val" style={{ fontStyle: "italic" }}>{r.montoLetras || "—"}</div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="rp-conceptos-title">Por concepto de:</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
            {[...CONCEPTOS.filter(c => c.col === 0), ...CONCEPTOS.filter(c => c.col === 1)].map(c => (
              <div key={c.id} className={`rp-item ${r.conceptos[c.id] ? "checked" : "unchecked"}`}>
                <div className="rp-box" style={{ borderColor: r.conceptos[c.id] ? "var(--navy)" : "#ccc", color: r.conceptos[c.id] ? "var(--navy)" : "#ccc" }}>
                  {r.conceptos[c.id] ? "✓" : ""}
                </div>
                <span>{c.label}{c.id === "otros" && r.otrosTexto ? `: ${r.otrosTexto}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rp-footer">
        <div className="rp-sig">
          <div className="rp-sig line" />
          <div className="rp-sig label">Firma y Sello</div>
        </div>
        <div className="rp-date">
          Tarapoto, {r.fecha}
        </div>
      </div>
      <div className="rp-watermark">IE "Jiménez Pimentel" — Tarapoto</div>
    </>
  );
}