// ActionButton dimension constants
export const ACTION_BUTTON_SIZES = {
  // Icon-only buttons (in tables)
  iconOnly: {
    width: 32,
    height: 32,
  },
  // Label buttons in modals / page headers — auto width prevents cramped/stuck labels
  labelOnly: {
    width: 'auto' as const,
    height: 40,
  },
} as const;

// Professional teal / slate palette (aligned with globals.css)
export const ACTION_BUTTON_COLORS = {
  primary: '#0f766e',
  success: '#0f766e',
  danger: '#dc2626',
  secondary: '#64748b',
  info: '#0369a1',
  warning: '#c2410c',
  purple: '#0e7490',
  green: '#15803d',
} as const;
