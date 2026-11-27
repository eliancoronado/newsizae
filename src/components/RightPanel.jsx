import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { RxSpaceEvenlyHorizontally, RxBorderWidth, RxBoxModel } from "react-icons/rx";
import { CgDropOpacity } from "react-icons/cg";
import {
  LuAlignLeft,
  LuAlignCenter,
  LuAlignRight,
  LuAlignJustify,
  LuAlignStartHorizontal,
  LuAlignCenterHorizontal,
  LuAlignEndHorizontal,
  LuAlignStartVertical,
  LuAlignCenterVertical,
  LuAlignEndVertical,
  LuAlignHorizontalSpaceAround,
  LuAlignHorizontalSpaceBetween,
  LuChevronDown,
  LuPlus,
  LuMinus,
  LuPalette,
  LuSparkles,
  LuLayoutGrid,
  LuPencil,
} from "react-icons/lu";
import {
  TbBoxAlignTopFilled,
  TbBoxAlignBottomFilled,
  TbBoxAlignLeftFilled,
  TbBoxAlignRightFilled,
  TbBoxAlignTopLeftFilled,
  TbBoxAlignTopRightFilled,
  TbBoxAlignBottomLeftFilled,
  TbBoxAlignBottomRightFilled,
} from "react-icons/tb";
import { MdBorderTop, MdOutlineBorderBottom, MdBorderLeft, MdBorderRight, MdOutlineStyle } from "react-icons/md";
import { BiSolidHide, BiLayer } from "react-icons/bi";
import useStore from "../store/store";
import useElement from "../store/useElement";
import FullColorPicker from "./FullColorPicker";

/* ───────────────────────── Configuración ─────────────────────────
   Escala de la opacidad de fondo: 1 => 0–1 | 100 => 0–100.
   Ajusta este valor según lo que espere tu handleStyleChange. */
const OPACITY_SCALE = 1;

/* ───────────────────────── Datos ───────────────────────── */
const FONTS = ["Oswald", "Space Mono", "Poppins", "Roboto", "Inter", "Open Sans"].map((f) => ({
  value: `${f}, serif`,
  label: f,
  style: { fontFamily: `${f}, serif` },
}));
const WEIGHTS = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
];
const FONT_SIZES = ["12px", "14px", "16px", "20px", "24px", "32px", "48px"];
const SWATCHES = ["#FFFFFF", "#000000", "#7C6CFF", "#FF6B6B", "#FFC857", "#2EC4B6", "#4D96FF", "#9A9AB8"];
const DISPLAYS = [
  { value: "block", label: "Bloque" },
  { value: "inline-block", label: "En línea" },
  { value: "flex", label: "Flexible" },
  { value: "grid", label: "Grilla" },
  { value: "list-item", label: "Lista" },
  { value: "none", label: "Esconder" },
];
const DIRECTIONS = [
  { value: "row", label: "Fila" },
  { value: "column", label: "Columna" },
  { value: "row-reverse", label: "Fila invertida" },
  { value: "column-reverse", label: "Columna invertida" },
];
const POSITIONS = [
  { value: "", label: "Ninguna" },
  { value: "static", label: "Estática" },
  { value: "relative", label: "Relativa" },
  { value: "absolute", label: "Absoluta" },
  { value: "fixed", label: "Fija" },
];
const BORDER_STYLES = [
  { value: "solid", label: "Sólida" },
  { value: "dashed", label: "Rayas" },
  { value: "dotted", label: "Puntos" },
  { value: "none", label: "Ninguno" },
];
const SHADOWS = [
  { value: "", label: "Sin definir" },
  { value: "none", label: "Ninguna" },
  { value: "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)", label: "Pequeña" },
  { value: "0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)", label: "Mediana" },
  { value: "0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)", label: "Grande" },
  { value: "0 15px 25px rgba(0, 0, 0, 0.22), 0 10px 10px rgba(0, 0, 0, 0.2)", label: "Extra grande" },
];
const BLURS = [
  { value: "", label: "Ninguno" },
  { value: "blur(4px)", label: "Pequeño" },
  { value: "blur(8px)", label: "Poco" },
  { value: "blur(12px)", label: "Mediano" },
  { value: "blur(24px)", label: "Grande" },
];
const INPUT_TYPES = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "password", label: "Contraseña" },
  { value: "email", label: "Correo" },
  { value: "date", label: "Fecha" },
  { value: "time", label: "Hora" },
  { value: "checkbox", label: "Casilla" },
  { value: "radio", label: "Opción" },
  { value: "range", label: "Rango" },
  { value: "file", label: "Archivo" },
  { value: "color", label: "Color" },
  { value: "submit", label: "Enviar" },
];
const ANIMATIONS = [
  { group: "Aparecer", items: [["fade", "Desvanecer"], ["fade-up", "Desde abajo"], ["fade-down", "Desde arriba"], ["fade-left", "Desde la izquierda"], ["fade-right", "Desde la derecha"], ["fade-up-right", "Abajo-derecha"], ["fade-up-left", "Abajo-izquierda"], ["fade-down-right", "Arriba-derecha"], ["fade-down-left", "Arriba-izquierda"]] },
  { group: "Girar", items: [["flip-up", "Arriba"], ["flip-down", "Abajo"], ["flip-left", "Izquierda"], ["flip-right", "Derecha"]] },
  { group: "Deslizar", items: [["slide-up", "Desde abajo"], ["slide-down", "Desde arriba"], ["slide-left", "Desde la izquierda"], ["slide-right", "Desde la derecha"]] },
  { group: "Zoom", items: [["zoom-in", "Acercar"], ["zoom-in-up", "Acercar + abajo"], ["zoom-in-down", "Acercar + arriba"], ["zoom-in-left", "Acercar + izquierda"], ["zoom-in-right", "Acercar + derecha"], ["zoom-out", "Alejar"], ["zoom-out-up", "Alejar + arriba"], ["zoom-out-down", "Alejar + abajo"], ["zoom-out-left", "Alejar + izquierda"], ["zoom-out-right", "Alejar + derecha"]] },
];
const TABS = [
  { id: "contenido", label: "Contenido", icon: LuPencil },
  { id: "estilo", label: "Estilo", icon: LuPalette },
  { id: "layout", label: "Layout", icon: LuLayoutGrid },
  { id: "extras", label: "Extras", icon: LuSparkles },
];
const SIDES = [
  ["Top", "Arriba", TbBoxAlignTopFilled],
  ["Bottom", "Abajo", TbBoxAlignBottomFilled],
  ["Left", "Izquierda", TbBoxAlignLeftFilled],
  ["Right", "Derecha", TbBoxAlignRightFilled],
];
const CORNERS = [
  ["borderTopLeftRadius", "Sup. izq.", TbBoxAlignTopLeftFilled],
  ["borderTopRightRadius", "Sup. der.", TbBoxAlignTopRightFilled],
  ["borderBottomLeftRadius", "Inf. izq.", TbBoxAlignBottomLeftFilled],
  ["borderBottomRightRadius", "Inf. der.", TbBoxAlignBottomRightFilled],
];

/* ───────────────────────── Estilos base ───────────────────────── */
const boxCls =
  "w-full min-h-11 rounded-xl bg-[#25253B] border border-[#3A3A58] text-[#F2F2F7] text-base px-3 outline-none focus:border-[#7C6CFF] focus:ring-2 focus:ring-[#7C6CFF]/30 transition";

/* ───────────────────────── Componentes reutilizables ─────────────────────────
   Están fuera de RightPanel para que no se vuelvan a montar en cada render
   (así el teclado no se cierra mientras se escribe). */

const Field = ({ label, icon: Icon, children, className = "" }) => (
  <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
    {label && (
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#9A9AB8]">
        {Icon && <Icon className="text-sm" />}
        {label}
      </span>
    )}
    {children}
  </div>
);

const Section = ({ title, icon: Icon, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl bg-[#2A2A43] border border-[#38385A] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full h-12 px-4 flex items-center gap-2.5 text-left text-[15px] font-semibold text-[#F2F2F7] active:bg-[#30304D]"
      >
        {Icon && <Icon className="text-lg text-[#A89CFF]" />}
        <span className="flex-1">{title}</span>
        <LuChevronDown className={`text-lg text-[#9A9AB8] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-1 flex flex-col gap-4">{children}</div>}
    </section>
  );
};

const Seg = ({ value, onChange, options }) => (
  <div
    role="group"
    className="grid gap-1 p-1 rounded-xl bg-[#25253B]"
    style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
  >
    {options.map((o) => {
      const on = value === o.value;
      const Icon = o.icon;
      return (
        <button
          key={o.value}
          type="button"
          title={o.label}
          aria-label={o.label}
          aria-pressed={on}
          onClick={() => onChange(o.value)}
          className={`h-10 rounded-lg flex items-center justify-center text-sm transition ${
            on ? "bg-[#7C6CFF] text-white shadow-md" : "text-[#B4B4CE] active:bg-[#33334F]"
          }`}
        >
          <Icon className="text-xl" />
        </button>
      );
    })}
  </div>
);

const Chips = ({ value, onChange, options }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => {
      const v = typeof o === "string" ? o : o.value;
      const label = typeof o === "string" ? o : o.label;
      const on = String(value ?? "") === String(v);
      return (
        <button
          key={String(v)}
          type="button"
          aria-pressed={on}
          onClick={() => onChange(v)}
          style={typeof o === "string" ? undefined : o.style}
          className={`h-9 px-3.5 rounded-full text-sm border transition ${
            on
              ? "bg-[#7C6CFF] border-[#7C6CFF] text-white"
              : "bg-[#25253B] border-[#3A3A58] text-[#D0D0E4] active:bg-[#33334F]"
          }`}
        >
          {label}
        </button>
      );
    })}
  </div>
);

const parseVal = (v) => {
  const s = String(v ?? "").trim();
  const m = s.match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
  return m ? { n: parseFloat(m[1]), u: m[2], raw: s } : { n: null, u: "", raw: s };
};

/* Campo numérico con botones − / +. Tocar la unidad la cambia (px → % → rem). */
const Stepper = ({ value, onChange, step = 1, min, max, unitless = false, units = ["px", "%", "rem"], icon, label, placeholder }) => {
  const p = parseVal(value);
  const unit = unitless ? "" : p.u || units[0];
  const clamp = (n) => {
    let x = n;
    if (min !== undefined) x = Math.max(min, x);
    if (max !== undefined) x = Math.min(max, x);
    return Math.round(x * 100) / 100;
  };
  const bump = (dir) => onChange(`${clamp((p.n ?? 0) + dir * step)}${unit}`);
  const cycleUnit = () => {
    const i = units.indexOf(unit);
    onChange(`${p.n}${units[(i + 1) % units.length]}`);
  };
  const handleType = (e) => {
    const t = e.target.value;
    if (t === "") return onChange("");
    if (/^-?\d+(\.\d+)?$/.test(t)) onChange(`${t}${unit}`);
    else onChange(t);
  };
  const btn = "w-10 shrink-0 h-full flex items-center justify-center text-[#C9C9E0] active:bg-[#33334F] transition";
  return (
    <Field label={label} icon={icon}>
      <div className="flex items-center h-11 rounded-xl bg-[#25253B] border border-[#3A3A58] focus-within:border-[#7C6CFF] overflow-hidden">
        <button type="button" aria-label="Restar" onClick={() => bump(-1)} className={btn}>
          <LuMinus />
        </button>
        <input
          inputMode="decimal"
          placeholder={placeholder}
          value={p.n !== null ? String(p.n) : p.raw}
          onChange={handleType}
          className="min-w-0 flex-1 h-full bg-transparent text-center text-base text-[#F2F2F7] outline-none"
        />
        {!unitless && p.n !== null && (
          <button type="button" onClick={cycleUnit} aria-label="Cambiar unidad" className="px-1.5 h-full text-xs font-semibold text-[#A89CFF] active:bg-[#33334F]">
            {unit}
          </button>
        )}
        <button type="button" aria-label="Sumar" onClick={() => bump(1)} className={btn}>
          <LuPlus />
        </button>
      </div>
    </Field>
  );
};

const Slider = ({ label, value, onChange, min = 0, max = 100, step = 1, suffix = "" }) => (
  <Field label={label}>
    <div className="flex items-center gap-3 h-11 px-3 rounded-xl bg-[#25253B] border border-[#3A3A58]">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number(value) || 0}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-6 accent-[#7C6CFF]"
      />
      <span className="w-16 text-right text-sm tabular-nums text-[#F2F2F7]">
        {Number(value) || 0}
        {suffix}
      </span>
    </div>
  </Field>
);

const Toggle = ({ label, icon: Icon, checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex items-center gap-3 h-11 px-3 rounded-xl bg-[#25253B] border border-[#3A3A58] text-left active:bg-[#2D2D47]"
  >
    {Icon && <Icon className="text-xl text-[#9A9AB8]" />}
    <span className="flex-1 text-sm text-[#E4E4F0]">{label}</span>
    <span className={`w-10 h-6 rounded-full p-0.5 transition ${checked ? "bg-[#7C6CFF]" : "bg-[#4A4A6A]"}`}>
      <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`} />
    </span>
  </button>
);

const ColorField = ({ value, onChange }) => {
  const hex = /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#000000";
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scroll scrollbar-hide py-1 -mx-1 px-1">
      <label
        className="relative shrink-0 w-10 h-10 rounded-full border-2 border-dashed border-[#7C6CFF] flex items-center justify-center overflow-hidden cursor-pointer"
        style={{ background: value || "transparent" }}
        title="Elegir otro color"
      >
        <LuPalette className="text-lg text-white mix-blend-difference" />
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          aria-label="Elegir color personalizado"
        />
      </label>
      {SWATCHES.map((c) => {
        const on = (value || "").toLowerCase() === c.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            aria-label={`Color ${c}`}
            onClick={() => onChange(c)}
            style={{ background: c }}
            className={`shrink-0 w-9 h-9 rounded-full border border-white/20 transition ${
              on ? "ring-2 ring-offset-2 ring-offset-[#2A2A43] ring-[#7C6CFF]" : ""
            }`}
          />
        );
      })}
    </div>
  );
};

/* Cuatro lados + valor global, con atajos rápidos */
const SpacingBox = ({ prop, st, onChange, globalLabel, min }) => (
  <>
    <Stepper icon={RxBoxModel} label={globalLabel} value={st[prop]} step={4} min={min} placeholder="0" onChange={(v) => onChange(prop, v)} />
    <Chips value={st[prop]} onChange={(v) => onChange(prop, v)} options={["0", "8px", "16px", "24px", "32px"]} />
    <div className="grid grid-cols-2 gap-3">
      {SIDES.map(([s, l, I]) => (
        <Stepper key={s} icon={I} label={l} value={st[prop + s]} step={4} min={min} onChange={(v) => onChange(prop + s, v)} />
      ))}
    </div>
  </>
);

/* ───────────────────────── Panel ───────────────────────── */
const RightPanel = ({
  handleStyleChange,
  handleTextChange,
  handlePlaceholderChange,
  handleClassChange,
  handleTypeInputChange,
  handleSrcImgChange,
  handleValOptChange,
  handleHrefChange,
  handleAnimationChange,
  handleDurAnimationChange,
  handleRetAnimationChange,
  prid,
  gs,
  isPlay,
}) => {
  const {
    url,
    projectData: project,
    droppedElements,
    setDroppedElements,
    selectedPage,
    setSelectedPage,
    selectedElement,
    setSelectedElement,
  } = useStore();
  const { selectedId, targetId, setSelectedId, setTargetId } = useElement();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [tab, setTab] = useState("contenido");

  const findElementById = (elements, id) => {
    for (const el of elements) {
      if (String(el.id) === String(id)) return el;
      if (el.children) {
        const found = findElementById(el.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleGradientChange = useCallback(
    (gradient) => handleStyleChange("background", gradient),
    [handleStyleChange]
  );

  /* Copiar estilos de un elemento a otro */
  const applyStyles = () => {
    if (!selectedId || !targetId) {
      console.error("Selecciona ambos elementos antes de aplicar los estilos.");
      return;
    }
    if (!Array.isArray(droppedElements) || droppedElements.length === 0) {
      console.error("droppedElements no es un array válido o está vacío.");
      return;
    }
    const source = findElementById(droppedElements, selectedId);
    if (!source) {
      console.error(`El elemento con ID ${selectedId} no existe en droppedElements.`);
      return;
    }
    const updateStylesRecursively = (elements) =>
      elements.map((el) => {
        if (el.id === Number(targetId)) return { ...el, styles: { ...source.styles } };
        if (el.children) return { ...el, children: updateStylesRecursively(el.children) };
        return el;
      });
    setDroppedElements(updateStylesRecursively(droppedElements));
  };

  /* Aplicar un estilo global al elemento seleccionado */
  const applyGlobalStyles = (selectedStyleName) => {
    if (!selectedStyleName) return;
    if (!Array.isArray(droppedElements) || droppedElements.length === 0) {
      console.error("droppedElements no es un array válido o está vacío.");
      return;
    }
    const selectedStyle = gs.find((style) => style.name === selectedStyleName);
    if (!selectedStyle) {
      console.error(`El estilo global con nombre ${selectedStyleName} no existe.`);
      return;
    }
    const cleanedGlobalStyles = Object.fromEntries(
      Object.entries(selectedStyle.styles || {}).filter(([, val]) => val !== "" && val !== null && val !== undefined)
    );

    const updateStylesRecursively = (elements) =>
      elements.map((el) => {
        if (el.id === selectedElement.id) {
          const newStyles = { ...el.styles };
          for (const [styleName, value] of Object.entries(cleanedGlobalStyles)) {
            if (styleName === "margin") {
              newStyles.margin = value;
              delete newStyles.marginTop;
              delete newStyles.marginBottom;
              delete newStyles.marginLeft;
              delete newStyles.marginRight;
            } else if (styleName === "padding") {
              newStyles.padding = value;
              delete newStyles.paddingTop;
              delete newStyles.paddingBottom;
              delete newStyles.paddingLeft;
              delete newStyles.paddingRight;
            } else if (styleName === "borderRadius") {
              newStyles.borderRadius = value;
              delete newStyles.borderTopLeftRadius;
              delete newStyles.borderTopRightRadius;
              delete newStyles.borderBottomLeftRadius;
              delete newStyles.borderBottomRightRadius;
            } else if (styleName === "background") {
              newStyles.background = value;
              delete newStyles.backgroundColor;
            } else {
              newStyles[styleName] = value;
            }
          }
          return { ...el, styles: newStyles };
        }
        if (el.children) return { ...el, children: updateStylesRecursively(el.children) };
        return el;
      });

    setDroppedElements(updateStylesRecursively(droppedElements));
    setSelectedElement({
      ...selectedElement,
      styles: { ...selectedElement.styles, ...cleanedGlobalStyles },
    });
  };

  /* Reaplicar el estilo global cuando cambia la clase seleccionada */
  useEffect(() => {
    if (!selectedElement || !selectedElement.iconClass) return;
    const styleExists = gs.some((style) => style.name === selectedElement.iconClass);
    if (!styleExists) {
      console.warn(`⚠️ El estilo global "${selectedElement.iconClass}" no existe.`);
      return;
    }
    applyGlobalStyles(selectedElement.iconClass);
  }, [selectedElement?.iconClass, gs]);

  /* Sincronizar selectedElement si cambia el targetId */
  useEffect(() => {
    if (!selectedElement || String(selectedElement.id) !== String(targetId)) {
      const next = droppedElements.find((e) => String(e.id) === String(targetId));
      if (next) setSelectedElement({ ...next });
    }
  }, [droppedElements, targetId]);

  /* Evita navegar al tocar un enlace que se está editando
     (antes se registraba en cada render; ahora una sola vez y con limpieza) */
  useEffect(() => {
    const handler = (event) => {
      const target = event.target;
      if (target.tagName === "A" && selectedElement?.id !== undefined && String(selectedElement.id) === String(target.getAttribute("id"))) {
        event.preventDefault();
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [selectedElement?.id]);

  /* Imágenes subidas */
  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get(`${url}/imagesuploaded/${prid}`);
        setUploadedImages(response.data.images || []);
      } catch (error) {
        console.error("Error al cargar imágenes:", error);
      }
    })();
  }, []);

  const getRowCount = (value) => {
    if (!value) return "";
    const match = value.match(/repeat\((\d+),\s*1fr\)/);
    return match ? match[1] : "";
  };

  if (!project || !project.pages) {
    return <p className="p-4 text-[#9A9AB8]">Cargando…</p>;
  }

  const pageSelect = (cls) => (
    <select className={`${boxCls} ${cls}`} value={selectedPage} onChange={(e) => setSelectedPage(e.target.value)} aria-label="Página">
      {project.pages.map((page, i) => (
        <option key={i} value={page.name}>
          {page.name}
        </option>
      ))}
    </select>
  );

  /* Estado vacío */
  if (!selectedElement) {
    return (
      <div className="right-panel w-full h-full col-span-1 bg-[#1F1F33] p-4 flex flex-col gap-4">
        <h2 className="text-[#F2F2F7] text-lg font-semibold">Propiedades</h2>
        <Field label="Página">{pageSelect("")}</Field>
        <div className="rounded-2xl border border-dashed border-[#46466A] p-8 flex flex-col items-center gap-3 text-center">
          <LuPencil className="text-3xl text-[#A89CFF]" />
          <p className="text-sm text-[#B4B4CE]">Toca un elemento del lienzo para editar sus propiedades.</p>
        </div>
      </div>
    );
  }

  const st = selectedElement.styles || {};
  const set = handleStyleChange;
  const isFlexOrGrid = st.display === "flex" || st.display === "grid";
  const isOffset = st.position === "absolute" || st.position === "fixed";

  const renderOptions = (elements) =>
    elements.flatMap((el) => [
      <option key={el.id} value={String(el.id)}>
        {el.name} - {el.text}
      </option>,
      ...(el.children ? renderOptions(el.children) : []),
    ]);

  /* ───────── Pestañas ───────── */
  const tabContenido = (
    <>
      <Section title="Contenido" icon={LuPencil} defaultOpen>
        <Field label="Texto">
          <textarea
            rows={2}
            className={`${boxCls} py-2.5 resize-none`}
            value={selectedElement.text ?? ""}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        </Field>
        {selectedElement.placeholder && (
          <Field label="Texto de ayuda (placeholder)">
            <input className={boxCls} value={selectedElement.placeholder} onChange={(e) => handlePlaceholderChange(e.target.value)} />
          </Field>
        )}
        {selectedElement.iconClass && selectedElement.name === "Icon" && (
          <Field label="Icono ID">
            <input className={boxCls} value={selectedElement.iconClass} onChange={(e) => handleClassChange(e.target.value)} />
          </Field>
        )}
        {selectedElement.value && (
          <Field label="Valor">
            <input className={boxCls} value={selectedElement.value} onChange={(e) => handleValOptChange(e.target.value)} />
          </Field>
        )}
        {selectedElement.href && (
          <Field label="Ir a">
            <input className={boxCls} inputMode="url" value={selectedElement.href} onChange={(e) => handleHrefChange(e.target.value)} />
          </Field>
        )}
        {selectedElement.type && (
          <Field label="Tipo de input">
            <Chips value={selectedElement.type} onChange={handleTypeInputChange} options={INPUT_TYPES} />
          </Field>
        )}
      </Section>

      {selectedElement.src && (
        <Section title="Imagen" icon={LuLayoutGrid} defaultOpen>
          {uploadedImages.length === 0 ? (
            <p className="text-sm text-[#9A9AB8]">Aún no hay imágenes subidas a este proyecto.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {uploadedImages
                .filter((img) => typeof img === "string")
                .map((image, i) => {
                  const full = `${url}${image}`;
                  const on = selectedElement.src === full;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSrcImgChange(full)}
                      aria-pressed={on}
                      className={`aspect-square rounded-xl overflow-hidden border-2 bg-[#25253B] ${on ? "border-[#7C6CFF]" : "border-transparent"}`}
                    >
                      <img src={full} alt={image.split("/").pop()} loading="lazy" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
            </div>
          )}
        </Section>
      )}
    </>
  );

  const tabEstilo = (
    <>
      <Section title="Tipografía" icon={LuPencil} defaultOpen>
        <Field label="Fuente">
          <Chips value={st.fontFamily} onChange={(v) => set("fontFamily", v)} options={FONTS} />
        </Field>
        <Field label="Grosor">
          <Chips value={st.fontWeight} onChange={(v) => set("fontWeight", v)} options={WEIGHTS} />
        </Field>
        <Stepper label="Tamaño" value={st.fontSize} step={1} min={1} onChange={(v) => set("fontSize", v)} units={["px", "rem", "em"]} />
        <Chips value={st.fontSize} onChange={(v) => set("fontSize", v)} options={FONT_SIZES} />
        <Field label="Alineación">
          <Seg
            value={st.textAlign}
            onChange={(v) => set("textAlign", v)}
            options={[
              { value: "left", label: "Izquierda", icon: LuAlignLeft },
              { value: "center", label: "Centro", icon: LuAlignCenter },
              { value: "right", label: "Derecha", icon: LuAlignRight },
              { value: "justify", label: "Justificado", icon: LuAlignJustify },
            ]}
          />
        </Field>
        <Field label="Color del texto">
          <ColorField value={st.color} onChange={(v) => set("color", v)} />
        </Field>
      </Section>

      <Section title="Relleno" icon={LuPalette}>
        <FullColorPicker onChange={handleGradientChange} value={st.background} />
        <Slider
          label="Opacidad del fondo"
          value={selectedElement.backgroundOpacity ?? OPACITY_SCALE}
          min={0}
          max={OPACITY_SCALE}
          step={OPACITY_SCALE / 20}
          onChange={(v) => set("backgroundOpacity", v)}
        />
        <Field label="Desenfoque del fondo" icon={CgDropOpacity}>
          <Chips value={st.backdropFilter || ""} onChange={(v) => set("backdropFilter", v)} options={BLURS} />
        </Field>
      </Section>

      <Section title="Bordes" icon={RxBorderWidth}>
        <Stepper icon={RxBorderWidth} label="Grosor" value={st.borderWidth} min={0} onChange={(v) => set("borderWidth", v)} />
        <Field label="Color del borde">
          <ColorField value={st.borderColor} onChange={(v) => set("borderColor", v)} />
        </Field>
        <Field label="Estilo">
          <Chips value={st.borderStyle} onChange={(v) => set("borderStyle", v)} options={BORDER_STYLES} />
        </Field>
        <Stepper icon={RxBoxModel} label="Radio global" value={st.borderRadius} min={0} step={2} placeholder="0" onChange={(v) => set("borderRadius", v)} />
        <Chips value={st.borderRadius} onChange={(v) => set("borderRadius", v)} options={["0", "4px", "8px", "16px", "9999px"]} />
        <div className="grid grid-cols-2 gap-3">
          {CORNERS.map(([prop, l, I]) => (
            <Stepper key={prop} icon={I} label={l} value={st[prop]} min={0} step={2} onChange={(v) => set(prop, v)} />
          ))}
        </div>
        <Field label="Sombra">
          <Chips value={st.boxShadow || ""} onChange={(v) => set("boxShadow", v)} options={SHADOWS} />
        </Field>
      </Section>
    </>
  );

  const tabLayout = (
    <>
      <Section title="Disposición" icon={LuLayoutGrid} defaultOpen>
        <Field label="Mostrar como">
          <Chips value={st.display} onChange={(v) => set("display", v)} options={DISPLAYS} />
        </Field>
        {st.display === "flex" && (
          <Field label="Dirección">
            <Chips value={st.flexDirection} onChange={(v) => set("flexDirection", v)} options={DIRECTIONS} />
          </Field>
        )}
        {isFlexOrGrid && (
          <>
            <Field label="Alinear elementos">
              <Seg
                value={st.alignItems}
                onChange={(v) => set("alignItems", v)}
                options={[
                  { value: "start", label: "Inicio", icon: LuAlignStartHorizontal },
                  { value: "center", label: "Centro", icon: LuAlignCenterHorizontal },
                  { value: "end", label: "Final", icon: LuAlignEndHorizontal },
                ]}
              />
            </Field>
            <Field label="Distribuir">
              <Seg
                value={st.justifyContent}
                onChange={(v) => set("justifyContent", v)}
                options={[
                  { value: "start", label: "Inicio", icon: LuAlignStartVertical },
                  { value: "center", label: "Centro", icon: LuAlignCenterVertical },
                  { value: "end", label: "Final", icon: LuAlignEndVertical },
                  { value: "space-around", label: "Espacio alrededor", icon: LuAlignHorizontalSpaceAround },
                  { value: "space-evenly", label: "Espacio uniforme", icon: RxSpaceEvenlyHorizontally },
                  { value: "space-between", label: "Espacio entre", icon: LuAlignHorizontalSpaceBetween },
                ]}
              />
            </Field>
          </>
        )}
        {st.display === "grid" && (
          <div className="grid grid-cols-2 gap-3">
            {[
              ["gridTemplateColumns", "Columnas"],
              ["gridTemplateRows", "Filas"],
            ].map(([prop, l]) => (
              <Stepper
                key={prop}
                unitless
                min={1}
                label={l}
                placeholder="1"
                value={getRowCount(st[prop])}
                onChange={(v) => set(prop, v === "" ? "" : `repeat(${parseInt(v, 10) || 1}, 1fr)`)}
              />
            ))}
          </div>
        )}
        <Toggle label="Ocultar lo que se sale" icon={BiSolidHide} checked={st.overflow === "hidden"} onChange={(on) => set("overflow", on ? "hidden" : "visible")} />
      </Section>

      <Section title="Tamaños" icon={RxBoxModel}>
        <div className="grid grid-cols-2 gap-3">
          <Stepper label="Ancho" value={st.width} step={10} min={0} onChange={(v) => set("width", v)} units={["px", "%", "rem", "vw"]} />
          <Stepper label="Alto" value={st.height} step={10} min={0} onChange={(v) => set("height", v)} units={["px", "%", "rem", "vh"]} />
          <Stepper label="Ancho máx." value={st.maxWidth} step={10} min={0} onChange={(v) => set("maxWidth", v)} units={["px", "%", "rem", "vw"]} />
          <Stepper label="Alto máx." value={st.maxHeight} step={10} min={0} onChange={(v) => set("maxHeight", v)} units={["px", "%", "rem", "vh"]} />
        </div>
        <Field label="Ancho rápido">
          <Chips value={st.width} onChange={(v) => set("width", v)} options={["auto", "100%", "75%", "50%", "25%", "fit-content"]} />
        </Field>
        <Stepper label="Separación (gap)" value={st.gap} step={4} min={0} placeholder="0" onChange={(v) => set("gap", v)} />
      </Section>

      <Section title="Posición" icon={BiLayer}>
        <Chips value={st.position || ""} onChange={(v) => set("position", v)} options={POSITIONS} />
        {isOffset && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stepper icon={MdBorderTop} label="Arriba" value={st.top} onChange={(v) => set("top", v)} units={["px", "%", "rem"]} />
              <Stepper icon={MdOutlineBorderBottom} label="Abajo" value={st.bottom} onChange={(v) => set("bottom", v)} units={["px", "%", "rem"]} />
              <Stepper icon={MdBorderLeft} label="Izquierda" value={st.left} onChange={(v) => set("left", v)} units={["px", "%", "rem"]} />
              <Stepper icon={MdBorderRight} label="Derecha" value={st.right} onChange={(v) => set("right", v)} units={["px", "%", "rem"]} />
            </div>
            <Stepper unitless icon={BiLayer} label="Capa (z-index)" value={st.zIndex || ""} placeholder="0" onChange={(v) => set("zIndex", v)} />
            <Toggle
              label="Centrar"
              icon={LuAlignCenterVertical}
              checked={st.transform === "translate(-50%, -50%)"}
              onChange={(on) => set("transform", on ? "translate(-50%, -50%)" : "none")}
            />
          </>
        )}
      </Section>

      <Section title="Márgenes" icon={RxBoxModel}>
        <SpacingBox prop="margin" st={st} onChange={set} globalLabel="Margen global" />
      </Section>

      <Section title="Paddings" icon={RxBoxModel}>
        <SpacingBox prop="padding" st={st} onChange={set} globalLabel="Padding global" min={0} />
      </Section>
    </>
  );

  const tabExtras = (
    <>
      <Section title="Animación" icon={LuSparkles} defaultOpen>
        <Chips value={selectedElement.animation || ""} onChange={handleAnimationChange} options={[{ value: "", label: "Ninguna" }]} />
        {ANIMATIONS.map((g) => (
          <Field key={g.group} label={g.group}>
            <Chips
              value={selectedElement.animation || ""}
              onChange={handleAnimationChange}
              options={g.items.map(([value, label]) => ({ value, label }))}
            />
          </Field>
        ))}
        {selectedElement.animation && (
          <>
            <Slider label="Duración" value={selectedElement.duracionanim} min={0} max={3000} step={100} suffix=" ms" onChange={handleDurAnimationChange} />
            <Slider label="Retraso" value={selectedElement.retrasoanim} min={0} max={3000} step={100} suffix=" ms" onChange={handleRetAnimationChange} />
          </>
        )}
      </Section>

      <Section title="Herramientas" icon={MdOutlineStyle}>
        <Field label="Estilo global">
          <select
            className={boxCls}
            value={selectedElement.iconClass || ""}
            onChange={(e) => {
              const name = e.target.value;
              handleClassChange(name);
              if (!gs.some((style) => style.name === name)) return;
            }}
          >
            <option value="">Selecciona un estilo global</option>
            {gs.map((style) => (
              <option key={style.name} value={style.name}>
                {style.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Copiar estilos de">
          <select className={boxCls} value={selectedId || ""} onChange={(e) => setSelectedId(e.target.value || "")}>
            <option value="" disabled>
              Selecciona un elemento
            </option>
            {Array.isArray(droppedElements) ? renderOptions(droppedElements) : null}
          </select>
        </Field>
        <Field label="Aplicar estilos a">
          <select className={boxCls} value={targetId || ""} onChange={(e) => setTargetId(e.target.value || "")}>
            <option value="" disabled>
              Selecciona un elemento
            </option>
            {Array.isArray(droppedElements) ? renderOptions(droppedElements) : null}
          </select>
        </Field>
        <button
          type="button"
          onClick={applyStyles}
          disabled={!selectedId || !targetId}
          className="h-11 rounded-xl bg-[#7C6CFF] text-white font-semibold flex items-center justify-center gap-2 active:bg-[#6A5AEB] disabled:opacity-40 transition"
        >
          <MdOutlineStyle className="text-xl" />
          Aplicar estilos
        </button>
      </Section>

      <Section title="Avanzado" icon={LuSparkles}>
        <Field label="Cursor">
          <Chips
            value={st.cursor || ""}
            onChange={(v) => set("cursor", v)}
            options={[
              { value: "", label: "Predeterminado" },
              { value: "pointer", label: "Puntero" },
            ]}
          />
        </Field>
      </Section>
    </>
  );

  const content = { contenido: tabContenido, estilo: tabEstilo, layout: tabLayout, extras: tabExtras }[tab];

  return (
    <div className="right-panel w-full h-full col-span-1 bg-[#1F1F33] no-scroll overflow-y-auto scrollbar-hide font-[Inter,sans-serif]">
      {/* Cabecera fija: elemento, página y pestañas siempre a mano */}
      <header className="sticky top-0 z-20 bg-[#1F1F33]/95 backdrop-blur border-b border-[#38385A] px-3 pt-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-[#F2F2F7] text-base font-semibold truncate">{selectedElement.name || "Elemento"}</h2>
            <p className="text-xs text-[#9A9AB8]">Id: {selectedElement.id}</p>
          </div>
          {pageSelect("!w-[45%] !min-h-10 !h-10 text-sm")}
        </div>
        <nav className="grid grid-cols-4 mt-2" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(id)}
                className={`h-14 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium border-b-2 transition ${
                  on ? "text-white border-[#7C6CFF]" : "text-[#9A9AB8] border-transparent active:bg-[#2A2A43]"
                }`}
              >
                <Icon className={`text-xl ${on ? "text-[#A89CFF]" : ""}`} />
                {label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="p-3 pb-24 flex flex-col gap-3">{content}</div>
    </div>
  );
};

export default RightPanel;
