// @flow
// common style constants

export const INITIAL_TOOLTIP_STYLE = {
  // copied from @popperjs/core/src/modifiers/applyStyles.js
  position: 'absolute',
  left: '0',
  top: '0',
  margin: '0',
}

export const INITIAL_ARROW_STYLE = {
  // copied from @popperjs/core/src/modifiers/applyStyles.js
  position: 'absolute',
}

export const TOOLTIP_OFFSET_PX = 8

export const ARROW_OFFSET_PX = 2

export const ARROW_SIZE_PX = TOOLTIP_OFFSET_PX - ARROW_OFFSET_PX
