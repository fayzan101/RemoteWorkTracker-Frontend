// ActionButton dimension constants
export const ACTION_BUTTON_SIZES = {
  // Icon-only buttons (in tables)
  iconOnly: {
    width: 32,
    height: 32,
  },
  // Label-only buttons (in modals and page headers)
  labelOnly: {
    width: 120,
    height: 38,
  },
} as const;

// ActionButton color constants - Modern Blue Theme
export const ACTION_BUTTON_COLORS = {
  primary: '#2563eb',      // Blue - Primary/Update actions
  success: '#0284c7',      // Sky Blue - Add/Create/Success actions
  danger: '#ef4444',       // Red - Delete/Danger actions
  secondary: '#64748b',    // Slate - Cancel/Secondary actions
  info: '#0284c7',         // Sky Blue - Info/Toggle actions
  warning: '#f97316',      // Orange - Warning actions
  purple: '#3b82f6',       // Light Blue - Alternative actions
  green: '#22c55e',        // Green - Positive actions
} as const;
