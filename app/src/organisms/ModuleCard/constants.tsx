import { css } from 'styled-components'

import {
  ALIGN_START,
  COLORS,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import type { ModuleType } from '@opentrons/shared-data'

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

export const NO_CALIBRATION_TYPE: ModuleType[] = [
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
]
