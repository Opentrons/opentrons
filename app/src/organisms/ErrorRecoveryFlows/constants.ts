import { css } from 'styled-components'

import { SPACING, TYPOGRAPHY } from '@opentrons/components'

import type { StepOrder } from './types'

export const ERROR_KINDS = {
  GENERAL_ERROR: 'GENERAL_ERROR',
} as const

// TODO(jh, 05-09-24): Refactor to a directed graph. EXEC-430.
// Valid recovery routes and steps.
export const RECOVERY_MAP = {
  BEFORE_BEGINNING: {
    ROUTE: 'before-beginning',
    STEPS: {
      RECOVERY_DESCRIPTION: 'recovery-description',
    },
  },
  CANCEL_RUN: {
    ROUTE: 'cancel-run',
    STEPS: { CONFIRM_CANCEL: 'confirm-cancel' },
  },
  DROP_TIP_FLOWS: {
    ROUTE: 'drop-tip',
    STEPS: { BEGIN_REMOVAL: 'begin-removal', WIZARD: 'wizard' },
  },
  IGNORE_AND_RESUME: { ROUTE: 'ignore-and-resume', STEPS: {} },
  REFILL_AND_RESUME: { ROUTE: 'refill-and-resume', STEPS: {} },
  RETRY_FAILED_COMMAND: {
    ROUTE: 'retry-failed-command',
    STEPS: { CONFIRM_RETRY: 'confirm-retry' },
  },
  ROBOT_CANCELING: {
    ROUTE: 'robot-cancel-run',
    STEPS: {
      CANCELING: 'canceling',
    },
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
  ROBOT_RETRYING_COMMAND: {
    ROUTE: 'robot-retrying-command',
    STEPS: {
      RETRYING: 'retrying',
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
  RETRY_FAILED_COMMAND,
  ROBOT_CANCELING,
  ROBOT_RESUMING,
  ROBOT_IN_MOTION,
  ROBOT_RETRYING_COMMAND,
  DROP_TIP_FLOWS,
  REFILL_AND_RESUME,
  IGNORE_AND_RESUME,
  CANCEL_RUN,
} = RECOVERY_MAP

// The deterministic ordering of steps for a given route.
export const STEP_ORDER: StepOrder = {
  [BEFORE_BEGINNING.ROUTE]: [BEFORE_BEGINNING.STEPS.RECOVERY_DESCRIPTION],
  [OPTION_SELECTION.ROUTE]: [OPTION_SELECTION.STEPS.SELECT],
  [RETRY_FAILED_COMMAND.ROUTE]: [RETRY_FAILED_COMMAND.STEPS.CONFIRM_RETRY],
  [ROBOT_CANCELING.ROUTE]: [ROBOT_CANCELING.STEPS.CANCELING],
  [ROBOT_IN_MOTION.ROUTE]: [ROBOT_IN_MOTION.STEPS.IN_MOTION],
  [ROBOT_RESUMING.ROUTE]: [ROBOT_RESUMING.STEPS.RESUMING],
  [ROBOT_RETRYING_COMMAND.ROUTE]: [ROBOT_RETRYING_COMMAND.STEPS.RETRYING],
  [DROP_TIP_FLOWS.ROUTE]: [
    DROP_TIP_FLOWS.STEPS.BEGIN_REMOVAL,
    DROP_TIP_FLOWS.STEPS.WIZARD,
  ],
  [REFILL_AND_RESUME.ROUTE]: [],
  [IGNORE_AND_RESUME.ROUTE]: [],
  [CANCEL_RUN.ROUTE]: [CANCEL_RUN.STEPS.CONFIRM_CANCEL],
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
