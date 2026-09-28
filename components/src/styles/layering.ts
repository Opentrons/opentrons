export const Z_INDEX = {
  /** Base z-index. Use for headers, anything that needs a z-index but shouldn't occlude other content. */
  BASE: 1,

  /** Details - for tooltips, popovers, specialinputs, etc. */
  DETAILS: 2,

  /** Menus - for dropdowns, context menus, etc. */
  MENUS: 5,

  /** Modals - for dialogs, popups, etc. */
  MODALS: 10,

  /** Modal details - for modal headers, modal footers, etc. */
  MODAL_DETAILS: 15,

  /** Blocking modals - for dialogs, popups, etc. that should block user interaction with other modals. */
  BLOCKING_MODALS: 20,

  /** Details of blocking modals */
  BLOCKING_MODAL_DETAILS: 25,

  /** Compliance modals - for documentation required modals, robot cert import, etc. */
  COMPLIANCE_MODALS: 30,

  /** Details of compliance modals i.e. action view */
  COMPLIANCE_MODAL_DETAILS: 35,

  /** Toasts - for notifications, alerts, etc. */
  TOASTS: 40,

  /** Logged out overlay - prevents all user interaction with the ODD while logged out */
  LOGGED_OUT_OVERLAY: 100,

  /** Login modal */
  LOGIN_MODAL: 105,

  /** Login toasts - for specific notifications shown during login */
  LOGIN_TOASTS: 106,
}
