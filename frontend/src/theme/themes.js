// ─────────────────────────────────────────────────────────────────────────────
//  Sistema de Temas — Gestión de Activos TI
//
//  Tres temas disponibles:
//    · dark    — Oscuro profundo con acento azul neón (default)
//    · light   — Blanco limpio con tipografía de alto contraste
//    · slate   — Gris azulado corporativo (intermedio)
//
//  Cada tema define variables CSS que se inyectan en :root.
//  Tailwind sigue funcionando normalmente; las clases condicionadas por tema
//  se reducen a mínimo usando estas variables.
// ─────────────────────────────────────────────────────────────────────────────

export const THEMES = {
dark: {
    label: 'Oscuro Neón',
    emoji: '🌌',
    // Fondos: Negro profundo OLED con Gris Oscuro SÓLIDO para evitar fallos en selectores
    '--bg-app':          '#020617',          // Azul/Negro espacio profundo (slate-950)
    '--bg-sidebar':      '#0b1329',          // Capa sólida oscura para el lateral
    '--bg-card':         '#0f172a',          // Color SÓLIDO (slate-900). Esto repara el fondo blanco del selector
    '--bg-card-hover':   '#1e293b',          // Hover sólido para resaltar opciones (slate-800)
    '--bg-input':        '#020617',          // Fondo de inputs oscuro puro
    '--bg-badge':        'rgba(6, 182, 212, 0.15)', // Fondo de etiquetas traslúcido cian neón
    // Bordes: Finos con destellos eléctricos
    '--border':          '#334155',          // Borde slate-700
    '--border-focus':    '#06b6d4',          // Borde Cian Neón al enfocar (cyan-500)
    // Texto: Contraste cyber nítido
    '--text-primary':    '#f8fafc',          // Blanco puro brillante (slate-50)
    '--text-secondary':  '#cbd5e1',          // Gris claro (slate-300)
    '--text-muted':      '#64748b',          // Slate 500
    '--text-label':      '#06b6d4',          // Títulos de inputs en Cian Eléctrico
    // Acento: Cian Cyber / Eléctrico Neón
    '--accent':          '#06b6d4',          // Cian neón puro de alta visibilidad (cyan-500)
    '--accent-hover':    '#22d3ee',          // Cian brillante en hovers (cyan-400)
    '--accent-glow':     'rgba(6, 182, 212, 0.45)', // Destello neón incrementado para sombras y efectos
    // Tipografía
    '--font-sans':       "'Inter', 'DM Sans', system-ui, sans-serif",
    '--font-mono':       "'JetBrains Mono', 'Fira Code', monospace",
    '--font-display':    "'Inter', system-ui, sans-serif",
    '--fw-heading':      '800',
    '--ls-heading':      '-0.04em',
    // Misc
    '--radius':          '1rem',
    '--shadow-card':     '0 0 25px rgba(6, 182, 212, 0.15)', // Brillo perimetral neón en tarjetas
    '--scrollbar-thumb': '#06b6d4',
  },

light: {
    label: 'Azul Ejecutivo',
    emoji: '🔵',
    // Fondos: Blanco puro con contrastes sutiles en gris-azul
    '--bg-app':          '#f8fafc',          // Fondo blanco-azulado (Slate 50)
    '--bg-sidebar':      '#ffffff',          // Sidebar pura
    '--bg-card':         '#ffffff',          // Tarjetas limpias
    '--bg-card-hover':   '#f1f5f9',          // Hover en azul grisáceo (Slate 100)
    '--bg-input':        '#f8fafc',          // Inputs neutros
    '--bg-badge':        '#e2e8f0',          // Badges en tono Slate 200
    // Bordes: Azules muy tenues
    '--border':          '#e2e8f0',          // Borde Slate 200
    '--border-focus':    '#60a5fa',          // Foco azul brillante (Blue 400)
    // Texto: Basado en tonos Slate, más legibles y menos cansados que el negro puro
    '--text-primary':    '#0f172a',          // Azul marino muy oscuro (Slate 900)
    '--text-secondary':  '#334155',          // Slate 700
    '--text-muted':      '#64748b',          // Slate 500
    '--text-label':      '#475569',          // Slate 600
    // Acento: Azul Corporativo / Azul Cobalto
    '--accent':          '#2563eb',          // Azul vibrante (Blue 600)
    '--accent-hover':    '#1d4ed8',          // Azul profundo para hovers (Blue 700)
    '--accent-glow':     'rgba(37, 99, 235, 0.15)',
    // Tipografía: Limpia y moderna
    '--font-sans':       "'Inter', system-ui, sans-serif",
    '--font-mono':       "'JetBrains Mono', monospace",
    '--font-display':    "'Inter', system-ui, sans-serif",
    '--fw-heading':      '600',
    '--ls-heading':      '-0.02em',
    // Misc
    '--radius':          '0.75rem',
    '--shadow-card':     '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '--scrollbar-thumb': '#94a3b8',
  },
Gris: {
    label: 'Gris Nardo',
    emoji: '🐺',
    // Fondos: Escala de grises cemento/nardo balanceados
    '--bg-app':          '#cbd5e1',          // Gris Nardo puro de base (slate-300)
    '--bg-sidebar':      '#94a3b8',          // Sidebar ligeramente más oscura para contraste (slate-400)
    '--bg-card':         '#f1f5f9',          // Tarjetas en gris nardo claro para resaltar del fondo (slate-100)
    '--bg-card-hover':   '#ffe4e6',          // Hover sutilmente cálido o reactivo
    '--bg-input':        '#ffffff',          // Inputs en blanco puro para máxima legibilidad al escribir
    '--bg-badge':        '#ffedd5',          // Badges naranja pastel discretos
    // Bordes: Líneas industriales limpias
    '--border':          '#94a3b8',          // Bordes gris nardo medio (slate-400)
    '--border-focus':    '#f97316',          // Foco en naranja puro (orange-500)
    // Texto: Tonos carbón de alto contraste sobre el gris cemento
    '--text-primary':    '#0f172a',          // Pizarra oscuro profundo (slate-900) para legibilidad total
    '--text-secondary':  '#334155',          // Slate 700 para textos secundarios
    '--text-muted':      '#475569',          // Slate 600 para detalles y placeholders
    '--text-label':      '#ea580c',          // Etiquetas de formularios en el naranja principal
    // Acento: Naranja Deportivo / Mecánico Industrial
    '--accent':          '#ea580c',          // Naranja sólido de alta visibilidad (orange-600)
    '--accent-hover':    '#c2410c',          // Naranja quemado profundo para hovers (orange-700)
    '--accent-glow':     'rgba(234, 88, 12, 0.2)',
    // Tipografía
    '--font-sans':       "'Inter', system-ui, sans-serif",
    '--font-mono':       "'JetBrains Mono', monospace",
    '--font-display':    "'Inter', system-ui, sans-serif",
    '--fw-heading':      '700',
    '--ls-heading':      '-0.03em',
    // Misc
    '--radius':          '0.75rem',
    '--shadow-card':     '0 4px 6px -1px rgba(15, 23, 42, 0.08)',
    '--scrollbar-thumb': '#ea580c',
  },
  slate: {
    label: 'Corporativo',
    emoji: '🏢',
    '--bg-app':          '#0f172a',
    '--bg-sidebar':      '#1e293b',
    '--bg-card':         '#1e293b',
    '--bg-card-hover':   '#273548',
    '--bg-input':        '#0f172a',
    '--bg-badge':        'rgba(255,255,255,0.05)',
    '--border':          'rgba(148,163,184,0.15)',
    '--border-focus':    'rgba(99,102,241,0.5)',
    '--text-primary':    '#e2e8f0',
    '--text-secondary':  '#94a3b8',
    '--text-muted':      '#64748b',
    '--text-label':      '#475569',
    '--accent':          '#6366f1',
    '--accent-hover':    '#818cf8',
    '--accent-glow':     'rgba(99,102,241,0.2)',
    '--font-sans':       "'IBM Plex Sans', 'Inter', system-ui, sans-serif",
    '--font-mono':       "'IBM Plex Mono', 'Fira Code', monospace",
    '--font-display':    "'IBM Plex Sans', system-ui, sans-serif",
    '--fw-heading':      '600',
    '--ls-heading':      '-0.02em',
    '--radius':          '0.75rem',
    '--shadow-card':     '0 2px 20px rgba(0,0,0,0.4)',
    '--scrollbar-thumb': '#4f46e5',
  },

  matrix: {
    label: 'Cyber Green',
    emoji: '🟢',
    // Estética hacker profesional: Negro absoluto con acentos verdes neón de alta tecnología
    '--bg-app':          '#000000',          // Negro absoluto para contraste infinito OLED
    '--bg-sidebar':      '#050505',          // Lateral ligeramente visible
    '--bg-card':         '#0a0a0a',          // Tarjetas oscuras sólidas
    '--bg-card-hover':   '#121212',          // Hover sutil
    '--bg-input':        '#0f0f0f',          // Cajas de entrada oscuras
    '--bg-badge':        'rgba(34,197,94,0.1)', // Fondo de etiquetas verde traslúcido
    '--border':          '#1f2937',          // Gris oscuro (Gray 800)
    '--border-focus':    '#22c55e',          // Borde verde neón al enfocar
    '--text-primary':    '#ffffff',          // Blanco puro para textos principales
    '--text-secondary':  '#a3a3a3',          // Gris claro para descripciones
    '--text-muted':      '#4b5563',          // Gris intermedio
    '--text-label':      '#22c55e',          // Etiquetas de formularios en verde neón institucional
    '--accent':          '#22c55e',          // Verde Neón / Esmeralda tecnológico (Green 500)
    '--accent-hover':    '#16a34a',          // Green 600 para hovers activos
    '--accent-glow':     'rgba(34,197,94,0.3)',
    '--font-sans':       "'Inter', system-ui, sans-serif",
    '--font-mono':       "'JetBrains Mono', monospace",
    '--font-display':    "'Inter', system-ui, sans-serif",
    '--fw-heading':      '700',
    '--ls-heading':      '-0.03em',
    '--radius':          '0.5rem',
    '--shadow-card':     '0 0 20px rgba(34,197,94,0.05)', // Brillo perimetral verde ultra tenue
    '--scrollbar-thumb': '#16a34a',
  },
};

export const THEME_KEYS = Object.keys(THEMES);
export const DEFAULT_THEME = 'dark';

/** Aplica el tema al :root del documento */
export function applyTheme(themeKey) {
  const theme = THEMES[themeKey] ?? THEMES[DEFAULT_THEME];
  const root  = document.documentElement;

  // Elimina clases de temas previos y aplica la nueva
  THEME_KEYS.forEach(k => root.classList.remove(`theme-${k}`));
  root.classList.add(`theme-${themeKey}`);

  // Inyecta las variables CSS
  Object.entries(theme).forEach(([prop, val]) => {
    root.style.setProperty(prop, val);
  });

  localStorage.setItem('theme', themeKey);
}