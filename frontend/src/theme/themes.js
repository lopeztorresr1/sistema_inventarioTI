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
    label: 'Oscuro',
    emoji: '🌑',
    // Fondos
    '--bg-app':          '#030712',
    '--bg-sidebar':      'rgba(255,255,255,0.018)',
    '--bg-card':         'rgba(255,255,255,0.025)',
    '--bg-card-hover':   'rgba(255,255,255,0.04)',
    '--bg-input':        'rgba(255,255,255,0.03)',
    '--bg-badge':        'rgba(255,255,255,0.06)',
    // Bordes
    '--border':          'rgba(255,255,255,0.07)',
    '--border-focus':    'rgba(59,130,246,0.5)',
    // Texto
    '--text-primary':    '#f1f5f9',
    '--text-secondary':  '#94a3b8',
    '--text-muted':      '#475569',
    '--text-label':      '#64748b',
    // Acento
    '--accent':          '#2563eb',
    '--accent-hover':    '#3b82f6',
    '--accent-glow':     'rgba(37,99,235,0.25)',
    // Tipografía
    '--font-sans':       "'Inter', 'DM Sans', system-ui, sans-serif",
    '--font-mono':       "'JetBrains Mono', 'Fira Code', monospace",
    '--font-display':    "'Inter', system-ui, sans-serif",
    '--fw-heading':      '800',
    '--ls-heading':      '-0.04em',
    // Misc
    '--radius':          '1rem',
    '--shadow-card':     '0 4px 32px rgba(0,0,0,0.5)',
    '--scrollbar-thumb': '#1d4ed8',
  },

  light: {
    label: 'Claro',
    emoji: '☀️',
    '--bg-app':          '#f8fafc',
    '--bg-sidebar':      '#ffffff',
    '--bg-card':         '#ffffff',
    '--bg-card-hover':   '#f1f5f9',
    '--bg-input':        '#f8fafc',
    '--bg-badge':        '#f1f5f9',
    '--border':          '#e2e8f0',
    '--border-focus':    'rgba(37,99,235,0.4)',
    '--text-primary':    '#0f172a',
    '--text-secondary':  '#334155',
    '--text-muted':      '#64748b',
    '--text-label':      '#94a3b8',
    '--accent':          '#2563eb',
    '--accent-hover':    '#1d4ed8',
    '--accent-glow':     'rgba(37,99,235,0.1)',
    '--font-sans':       "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    '--font-mono':       "'JetBrains Mono', 'Fira Code', monospace",
    '--font-display':    "'Plus Jakarta Sans', system-ui, sans-serif",
    '--fw-heading':      '700',
    '--ls-heading':      '-0.03em',
    '--radius':          '0.875rem',
    '--shadow-card':     '0 1px 8px rgba(15,23,42,0.08), 0 0 0 1px rgba(15,23,42,0.04)',
    '--scrollbar-thumb': '#93c5fd',
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