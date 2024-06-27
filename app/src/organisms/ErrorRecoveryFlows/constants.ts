import { css } from 'styled-components'

import { SPACING, TYPOGRAPHY } from '@opentrons/components'

import type { StepOrder } from './types'

// TODO(jh, 06-18-24): Add the correct errorTypes for these errors when they are available.
// Error types of "defined" errors, those handled explicitly by Error Recovery.
export const DEFINED_ERROR_TYPES = {
  NO_LIQUID_DETECTED: 'NO_FLUIDS_OH_NO',
  PIPETTE_COLLISION: 'AAAAAHHHHHHHHH',
  OVERPRESSURE_ASPIRATION: 'overpressure',
  OVERPRESSURE_DISPENSING: 'OVERPRESSURE_DISPENSING',
}

export const ERROR_KINDS = {
  GENERAL_ERROR: 'GENERAL_ERROR',
  NO_LIQUID_DETECTED: 'NO_LIQUID_DETECTED',
  OVERPRESSURE_PREPARE_TO_ASPIRATE: 'OVERPRESSURE_PREPARE_TO_ASPIRATE',
  OVERPRESSURE_WHILE_ASPIRATING: 'OVERPRESSURE_WHILE_ASPIRATING',
  OVERPRESSURE_WHILE_DISPENSING: 'OVERPRESSURE_WHILE_DISPENSING',
} as const

// TODO(jh, 05-09-24): Refactor to a directed graph. EXEC-430.
// TODO(jh, 06-14-24): Consolidate motion routes to a single route with several steps.
// Valid recovery routes and steps.
export const RECOVERY_MAP = {
  BEFORE_BEGINNING: {
    ROUTE: 'before-beginning',
    STEPS: {
      RECOVERY_DESCRIPTION: 'recovery-description',
    },
  },
  DROP_TIP_FLOWS: {
    ROUTE: 'drop-tip',
    STEPS: {
      BEGIN_REMOVAL: 'begin-removal',
      BEFORE_BEGINNING: 'before-beginning',
      CHOOSE_TIP_DROP: 'choose-tip-drop',
      CHOOSE_BLOWOUT: 'choose-blowout',
    },
  },
  ERROR_WHILE_RECOVERING: {
    ROUTE: 'error',
    STEPS: {
      RECOVERY_ACTION_FAILED: 'recovery-action-failed',
      DROP_TIP_BLOWOUT_FAILED: 'drop-tip-blowout-failed',
      DROP_TIP_TIP_DROP_FAILED: 'drop-tip-tip-drop-failed',
      DROP_TIP_GENERAL_ERROR: 'drop-tip-general-error',
    },
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
  ROBOT_PICKING_UP_TIPS: {
    ROUTE: 'robot-picking-up-tips',
    STEPS: {
      PICKING_UP_TIPS: 'picking-up-tips',
    },
  },
  ROBOT_RESUMING: {
    ROUTE: 'robot-resuming',
    STEPS: {
      RESUMING: 'resuming',
    },
  },
  ROBOT_RETRYING_STEP: {
    ROUTE: 'robot-retrying-step',
    STEPS: {
      RETRYING: 'retrying',
    },
  },
  ROBOT_SKIPPING_STEP: {
    ROUTE: 'robot-skipping-to-next-step',
    STEPS: {
      SKIPPING: 'skipping',
    },
  },
  // Recovery options below
  OPTION_SELECTION: {
    ROUTE: 'option-selection',
    STEPS: { SELECT: 'select' },
  },
  CANCEL_RUN: {
    ROUTE: 'cancel-run',
    STEPS: { CONFIRM_CANCEL: 'confirm-cancel' },
  },
  IGNORE_AND_SKIP: {
    ROUTE: 'ignore-and-skip-step',
    STEPS: { SELECT_IGNORE_KIND: 'select-ignore' },
  },
  FILL_MANUALLY_AND_SKIP: {
    ROUTE: 'manually-fill-well-and-skip',
    STEPS: { MANUALLY_FILL: 'manually-fill', SKIP: 'skip' },
  },
  REFILL_AND_RESUME: { ROUTE: 'refill-and-resume', STEPS: {} },
  RETRY_FAILED_COMMAND: {
    ROUTE: 'retry-failed-command',
    STEPS: { CONFIRM_RETRY: 'confirm-retry' },
  },
  RETRY_NEW_TIPS: {
    ROUTE: 'retry-new-tips',
    STEPS: {
      DROP_TIPS: 'drop-tips',
      REPLACE_TIPS: 'replace-tips',
      SELECT_TIPS: 'select-tips',
      RETRY: 'retry',
    },
  },
  RETRY_SAME_TIPS: {
    ROUTE: 'retry-same-tips',
    STEPS: {
      RETRY: 'retry',
    },
  },
  SKIP_STEP_WITH_NEW_TIPS: {
    ROUTE: 'skip-to-next-step-new-tips',
    STEPS: {
      DROP_TIPS: 'drop-tips',
      REPLACE_TIPS: 'replace-tips',
      SELECT_TIPS: 'select-tips',
      SKIP: 'skip',
    },
  },
  SKIP_STEP_WITH_SAME_TIPS: {
    ROUTE: 'skip-to-next-step-same-tips',
    STEPS: {
      SKIP: 'skip',
    },
  },
} as const

const {
  BEFORE_BEGINNING,
  OPTION_SELECTION,
  RETRY_FAILED_COMMAND,
  ROBOT_CANCELING,
  ROBOT_PICKING_UP_TIPS,
  ROBOT_RESUMING,
  ROBOT_IN_MOTION,
  ROBOT_RETRYING_STEP,
  ROBOT_SKIPPING_STEP,
  DROP_TIP_FLOWS,
  REFILL_AND_RESUME,
  IGNORE_AND_SKIP,
  CANCEL_RUN,
  RETRY_NEW_TIPS,
  RETRY_SAME_TIPS,
  ERROR_WHILE_RECOVERING,
  FILL_MANUALLY_AND_SKIP,
  SKIP_STEP_WITH_NEW_TIPS,
  SKIP_STEP_WITH_SAME_TIPS,
} = RECOVERY_MAP

// The deterministic ordering of steps for a given route.
export const STEP_ORDER: StepOrder = {
  [BEFORE_BEGINNING.ROUTE]: [BEFORE_BEGINNING.STEPS.RECOVERY_DESCRIPTION],
  [OPTION_SELECTION.ROUTE]: [OPTION_SELECTION.STEPS.SELECT],
  [RETRY_FAILED_COMMAND.ROUTE]: [RETRY_FAILED_COMMAND.STEPS.CONFIRM_RETRY],
  [RETRY_NEW_TIPS.ROUTE]: [
    RETRY_NEW_TIPS.STEPS.DROP_TIPS,
    RETRY_NEW_TIPS.STEPS.REPLACE_TIPS,
    RETRY_NEW_TIPS.STEPS.SELECT_TIPS,
    RETRY_NEW_TIPS.STEPS.RETRY,
  ],
  [RETRY_SAME_TIPS.ROUTE]: [RETRY_SAME_TIPS.STEPS.RETRY],
  [SKIP_STEP_WITH_NEW_TIPS.ROUTE]: [
    SKIP_STEP_WITH_NEW_TIPS.STEPS.DROP_TIPS,
    SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS,
    SKIP_STEP_WITH_NEW_TIPS.STEPS.SELECT_TIPS,
    SKIP_STEP_WITH_NEW_TIPS.STEPS.SKIP,
  ],
  [SKIP_STEP_WITH_SAME_TIPS.ROUTE]: [SKIP_STEP_WITH_SAME_TIPS.STEPS.SKIP],
  [ROBOT_CANCELING.ROUTE]: [ROBOT_CANCELING.STEPS.CANCELING],
  [ROBOT_IN_MOTION.ROUTE]: [ROBOT_IN_MOTION.STEPS.IN_MOTION],
  [ROBOT_PICKING_UP_TIPS.ROUTE]: [ROBOT_PICKING_UP_TIPS.STEPS.PICKING_UP_TIPS],
  [ROBOT_RESUMING.ROUTE]: [ROBOT_RESUMING.STEPS.RESUMING],
  [ROBOT_RETRYING_STEP.ROUTE]: [ROBOT_RETRYING_STEP.STEPS.RETRYING],
  [ROBOT_SKIPPING_STEP.ROUTE]: [ROBOT_SKIPPING_STEP.STEPS.SKIPPING],
  [DROP_TIP_FLOWS.ROUTE]: [
    DROP_TIP_FLOWS.STEPS.BEGIN_REMOVAL,
    DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING,
    DROP_TIP_FLOWS.STEPS.CHOOSE_BLOWOUT,
    DROP_TIP_FLOWS.STEPS.CHOOSE_TIP_DROP,
  ],
  [REFILL_AND_RESUME.ROUTE]: [],
  [IGNORE_AND_SKIP.ROUTE]: [IGNORE_AND_SKIP.STEPS.SELECT_IGNORE_KIND],
  [CANCEL_RUN.ROUTE]: [CANCEL_RUN.STEPS.CONFIRM_CANCEL],
  [FILL_MANUALLY_AND_SKIP.ROUTE]: [
    FILL_MANUALLY_AND_SKIP.STEPS.MANUALLY_FILL,
    FILL_MANUALLY_AND_SKIP.STEPS.SKIP,
  ],
  [ERROR_WHILE_RECOVERING.ROUTE]: [
    ERROR_WHILE_RECOVERING.STEPS.RECOVERY_ACTION_FAILED,
    ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_GENERAL_ERROR,
    ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_TIP_DROP_FAILED,
    ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_BLOWOUT_FAILED,
  ],
}

export const INVALID = 'INVALID' as const

/**
 * Styling
 */

export const BODY_TEXT_STYLE = css`
  ${TYPOGRAPHY.bodyTextRegular};
`

export const ODD_SECTION_TITLE_STYLE = css`
  margin-bottom: ${SPACING.spacing16};
`
