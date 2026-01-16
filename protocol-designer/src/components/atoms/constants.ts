import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  SPACING,
} from '@opentrons/components'

export const LINK_BUTTON_STYLE = css`
  color: ${COLORS.black90};

  &:hover {
    color: ${COLORS.blue50};
  }

  &:focus-visible {
    color: ${COLORS.blue50};
    outline: 2px solid ${COLORS.blue50};
    outline-offset: 0.25rem;
  }

  &:disabled {
    color: ${COLORS.grey40};
  }
`

const MIN_OVERVIEW_WIDTH = '64rem'
const COLUMN_GRID_GAP = '5rem'
export const COLUMN_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  min-width: calc((${MIN_OVERVIEW_WIDTH} - ${COLUMN_GRID_GAP}) * 0.5);
  flex: 1;
`

export const NAV_BAR_HEIGHT_REM = 3.75

export const GREY_BUTTON_STYLE = css`
  display: ${DISPLAY_FLEX};
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  grid-gap: ${SPACING.spacing8};
  align-items: ${ALIGN_CENTER};
  border-radius: ${BORDERS.borderRadius8};
  background-color: ${COLORS.grey30};

  &:focus-visible {
    outline-offset: 3px;
    outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
  }

  &:active {
    background-color: ${COLORS.grey40};
  }

  &:hover {
    box-shadow: 0 0 0;
    background-color: ${COLORS.grey35};
  }

  &:disabled {
    background-color: ${COLORS.grey30};
    color: ${COLORS.grey40};
  }
`
