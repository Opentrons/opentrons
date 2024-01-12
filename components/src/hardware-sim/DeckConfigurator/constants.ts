import { css } from 'styled-components'

import { ALIGN_CENTER, DISPLAY_FLEX, JUSTIFY_CENTER } from '../../styles'
import { BORDERS, COLORS, SPACING } from '../../ui-style-constants'

/**
 * These are Flex deck configurator-only values to position a foreign object
 * Position is relative to deck definition slot positions and a custom stroke applied to the single slot fixture SVG
 */
export const FIXTURE_HEIGHT = 102.0
export const SINGLE_SLOT_FIXTURE_WIDTH = 243.5
export const STAGING_AREA_FIXTURE_WIDTH = 314.5

export const COLUMN_1_X_ADJUSTMENT = -100
export const COLUMN_3_X_ADJUSTMENT = -15.5
export const Y_ADJUSTMENT = -8

export const STAGING_AREA_DISPLAY_NAME = 'Staging area'
export const TRASH_BIN_DISPLAY_NAME = 'Trash bin'
export const WASTE_CHUTE_DISPLAY_NAME = 'Waste chute'

// common config styles for staging area, trash bin, waste chute
export const CONFIG_STYLE_READ_ONLY = css`
  display: ${DISPLAY_FLEX};
  align-items: ${ALIGN_CENTER};
  background-color: ${COLORS.grey2};
  border-radius: ${BORDERS.borderRadiusSize1};
  color: ${COLORS.white};
  grid-gap: ${SPACING.spacing8};
  justify-content: ${JUSTIFY_CENTER};
  width: 100%;
`

export const CONFIG_STYLE_EDITABLE = css`
  ${CONFIG_STYLE_READ_ONLY}

  &:active {
    background-color: ${COLORS.darkBlack90};
  }

  &:hover {
    background-color: ${COLORS.grey1};
  }

  &:focus-visible {
    border: 3px solid ${COLORS.fundamentalsFocus};
  }
`
