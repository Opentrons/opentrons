import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  ALIGN_START,
} from '@opentrons/components'
import { css } from 'styled-components'

export const MODULE_INFO_SUB_CONTAINTER_STYLE = css`
  grid-gap: ${SPACING.spacing2};
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_START}
`

export const MODULE_INFO_HEADER_TEXT_STYLE = css`
  ${TYPOGRAPHY.h3Regular}
  color: ${COLORS.grey60};

  desktopstyle: 'bodyDefaultRegular';
`

export const MODULE_INFO_DETAIL_TEXT_STYLE = css`
  ${TYPOGRAPHY.h3Regular}
  color: ${COLORS.black90};

  desktopstyle: 'bodyDefaultRegular';
`
