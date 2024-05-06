import { css } from 'styled-components'

import { SPACING, TYPOGRAPHY } from '@opentrons/components'

import type { StepOrder } from './types'

export const ERROR_KINDS = {
  GENERAL_ERROR: 'GENERAL_ERROR',
} as const

// Valid recovery routes and steps.
export const RECOVERY_MAP = {
  BEFORE_BEGINNING: {
    ROUTE: 'before-beginning',
    STEPS: {
      RECOVERY_DESCRIPTION: 'recovery-description',
    },
  },
  CANCEL_RUN: { ROUTE: 'cancel-run', STEPS: {} },
  DROP_TIP: { ROUTE: 'drop-tip', STEPS: {} },
  IGNORE_AND_RESUME: { ROUTE: 'ignore-and-resume', STEPS: {} },
  REFILL_AND_RESUME: { ROUTE: 'refill-and-resume', STEPS: {} },
  RESUME: {
    ROUTE: 'resume',
    STEPS: { CONFIRM_RESUME: 'confirm-resume' },
  },
  ROBOT_IN_MOTION: {
    ROUTE: 'robot-in-motion',
    STEPS: {
      IN_MOTION: 'in-motion',
    },
  },
  ROBOT_RESUMING: {
    ROUTE: 'robot-resuming',
    STEPS: {
      RESUMING: 'resuming',
    },
  },
  OPTION_SELECTION: {
    ROUTE: 'option-selection',
    STEPS: { SELECT: 'select' },
  },
} as const

const {
  BEFORE_BEGINNING,
  OPTION_SELECTION,
  RESUME,
  ROBOT_RESUMING,
  ROBOT_IN_MOTION,
  DROP_TIP,
  REFILL_AND_RESUME,
  IGNORE_AND_RESUME,
  CANCEL_RUN,
} = RECOVERY_MAP

// The deterministic ordering of steps for a given route.
export const STEP_ORDER: StepOrder = {
  [BEFORE_BEGINNING.ROUTE]: [BEFORE_BEGINNING.STEPS.RECOVERY_DESCRIPTION],
  [OPTION_SELECTION.ROUTE]: [OPTION_SELECTION.STEPS.SELECT],
  [RESUME.ROUTE]: [RESUME.STEPS.CONFIRM_RESUME],
  [ROBOT_IN_MOTION.ROUTE]: [ROBOT_IN_MOTION.STEPS.IN_MOTION],
  [ROBOT_RESUMING.ROUTE]: [ROBOT_RESUMING.STEPS.RESUMING],
  [DROP_TIP.ROUTE]: [],
  [REFILL_AND_RESUME.ROUTE]: [],
  [IGNORE_AND_RESUME.ROUTE]: [],
  [CANCEL_RUN.ROUTE]: [],
}

export const INVALID = 'INVALID' as const

/**
 * Styling
 */

// These colors are temp and will be removed as design does design things.
export const NON_DESIGN_SANCTIONED_COLOR_1 = '#56FF00'
export const NON_DESIGN_SANCTIONED_COLOR_2 = '#FF00EF'

export const NON_SANCTIONED_RECOVERY_COLOR_STYLE_PRIMARY = css`
  background-color: ${NON_DESIGN_SANCTIONED_COLOR_1};

  &:active {
    background-color: ${NON_DESIGN_SANCTIONED_COLOR_2};
  }
  &:hover {
    background-color: ${NON_DESIGN_SANCTIONED_COLOR_1};
  }
  &:focus {
    background-color: ${NON_DESIGN_SANCTIONED_COLOR_2};
  }
`

export const NON_SANCTIONED_RECOVERY_COLOR_STYLE_SECONDARY = css`
  background-color: ${NON_DESIGN_SANCTIONED_COLOR_2};

  &:active {
    background-color: ${NON_DESIGN_SANCTIONED_COLOR_2};
  }
  &:hover {
    background-color: ${NON_DESIGN_SANCTIONED_COLOR_1};
  }
  &:focus {
    background-color: ${NON_DESIGN_SANCTIONED_COLOR_2};
  }
`

export const BODY_TEXT_STYLE = css`
  ${TYPOGRAPHY.bodyTextRegular};
`

export const ODD_SECTION_TITLE_STYLE = css`
  margin-bottom: ${SPACING.spacing16};
`
