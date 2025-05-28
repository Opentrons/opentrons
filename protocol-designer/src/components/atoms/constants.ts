import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  OVERFLOW_HIDDEN,
  SPACING,
} from '@opentrons/components'

import type { FlattenSimpleInterpolation } from 'styled-components'

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

/**
 * Generates a CSS style for clamping text to a specified number of lines,
 * with optional word-breaking behavior.
 *
 * @param {number} lineClamp - The number of lines to clamp the text to.
 * @param {boolean} [wordBase] - Optional flag to determine word-breaking behavior.
 * If true, words will break normally; if false or undefined, words will break at any character.
 *
 * @returns {FlattenSimpleInterpolation} - The generated CSS style.
 *
 * @example
 * const style = LINE_CLAMP_TEXT_STYLE(2, true);
 * // style will clamp text to 2 lines and break words normally
 */
export const LINE_CLAMP_TEXT_STYLE = (
  lineClamp: number,
  wordBase?: boolean
): FlattenSimpleInterpolation => css`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: ${OVERFLOW_HIDDEN};
  text-overflow: ellipsis;
  word-wrap: break-word;
  -webkit-line-clamp: ${lineClamp};
  word-break: ${wordBase === true
    ? 'normal'
    : 'break-all'}; // normal for tile and break-all for a non word case like aaaaaaaa
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
