import { css } from 'styled-components'

import {
  ALIGN_START,
  COLORS,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

export const MODULE_INFO_CONTAINER_STYLE = css`
  grid-gap: ${SPACING.spacing8};
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_START};
`
export const MODULE_INFO_SUB_CONTAINER_STYLE = css`
  grid-gap: ${SPACING.spacing4};
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_START};
`

export const MODULE_INFO_HEADER_TEXT_STYLE = css`
  ${TYPOGRAPHY.h3Regular}
  color: ${COLORS.grey60};

  desktopstyle: 'bodyDefaultRegular';
`
export const MODULE_INFO_DETAIL_CONTAINER_STYLE = css`
  grid-gap: ${SPACING.spacing2};
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_START};
`
export const MODULE_INFO_DETAIL_TEXT_STYLE = css`
  ${TYPOGRAPHY.h3Regular}
  color: ${COLORS.black90};

  desktopstyle: 'bodyDefaultRegular';
`
