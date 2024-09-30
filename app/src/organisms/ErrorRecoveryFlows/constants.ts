import { css } from 'styled-components'

import {
  RESPONSIVENESS,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'

import type { RecoveryRouteStepMetadata, StepOrder } from './types'

// Server-defined error types.
// (Values for the .error.errorType property of a run command.)
export const DEFINED_ERROR_TYPES = {
  OVERPRESSURE: 'overpressure',
  LIQUID_NOT_FOUND: 'liquidNotFound',
  TIP_PHYSICALLY_MISSING: 'tipPhysicallyMissing',
  GRIPPER_MOVEMENT: 'gripperMovement',
}

// Client-defined error-handling flows.
export const ERROR_KINDS = {
  GENERAL_ERROR: 'GENERAL_ERROR',
  NO_LIQUID_DETECTED: 'NO_LIQUID_DETECTED',
  OVERPRESSURE_PREPARE_TO_ASPIRATE: 'OVERPRESSURE_PREPARE_TO_ASPIRATE',
  OVERPRESSURE_WHILE_ASPIRATING: 'OVERPRESSURE_WHILE_ASPIRATING',
  OVERPRESSURE_WHILE_DISPENSING: 'OVERPRESSURE_WHILE_DISPENSING',
  TIP_NOT_DETECTED: 'TIP_NOT_DETECTED',
} as const

// TODO(jh, 05-09-24): Refactor to a directed graph. EXEC-430.
// TODO(jh, 06-14-24): Consolidate motion routes to a single route with several steps.
// Valid recovery routes and steps.
export const RECOVERY_MAP = {
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
  ROBOT_DOOR_OPEN: {
    ROUTE: 'door',
    STEPS: {
      DOOR_OPEN: 'door-open',
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
  RETRY_STEP: {
    ROUTE: 'retry-step',
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
  OPTION_SELECTION,
  RETRY_STEP,
  ROBOT_CANCELING,
  ROBOT_PICKING_UP_TIPS,
  ROBOT_RESUMING,
  ROBOT_IN_MOTION,
  ROBOT_RETRYING_STEP,
  ROBOT_SKIPPING_STEP,
  ROBOT_DOOR_OPEN,
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
  [OPTION_SELECTION.ROUTE]: [OPTION_SELECTION.STEPS.SELECT],
  [RETRY_STEP.ROUTE]: [RETRY_STEP.STEPS.CONFIRM_RETRY],
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
  [ROBOT_DOOR_OPEN.ROUTE]: [ROBOT_DOOR_OPEN.STEPS.DOOR_OPEN],
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

// Contains metadata specific to all routes and/or steps.
export const RECOVERY_MAP_METADATA: RecoveryRouteStepMetadata = {
  [DROP_TIP_FLOWS.ROUTE]: {
    [DROP_TIP_FLOWS.STEPS.BEGIN_REMOVAL]: { allowDoorOpen: false },
    [DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING]: {
      allowDoorOpen: false,
    },
    [DROP_TIP_FLOWS.STEPS.CHOOSE_TIP_DROP]: {
      allowDoorOpen: false,
    },
    [DROP_TIP_FLOWS.STEPS.CHOOSE_BLOWOUT]: {
      allowDoorOpen: false,
    },
  },
  [ERROR_WHILE_RECOVERING.ROUTE]: {
    [ERROR_WHILE_RECOVERING.STEPS.RECOVERY_ACTION_FAILED]: {
      allowDoorOpen: false,
    },
    [ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_BLOWOUT_FAILED]: {
      allowDoorOpen: false,
    },
    [ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_TIP_DROP_FAILED]: {
      allowDoorOpen: false,
    },
    [ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_GENERAL_ERROR]: {
      allowDoorOpen: false,
    },
  },
  [ROBOT_CANCELING.ROUTE]: {
    [ROBOT_CANCELING.STEPS.CANCELING]: { allowDoorOpen: false },
  },
  [ROBOT_IN_MOTION.ROUTE]: {
    [ROBOT_IN_MOTION.STEPS.IN_MOTION]: { allowDoorOpen: false },
  },
  [ROBOT_PICKING_UP_TIPS.ROUTE]: {
    [ROBOT_PICKING_UP_TIPS.STEPS.PICKING_UP_TIPS]: {
      allowDoorOpen: false,
    },
  },
  [ROBOT_RESUMING.ROUTE]: {
    [ROBOT_RESUMING.STEPS.RESUMING]: { allowDoorOpen: false },
  },
  [ROBOT_RETRYING_STEP.ROUTE]: {
    [ROBOT_RETRYING_STEP.STEPS.RETRYING]: { allowDoorOpen: false },
  },
  [ROBOT_SKIPPING_STEP.ROUTE]: {
    [ROBOT_SKIPPING_STEP.STEPS.SKIPPING]: { allowDoorOpen: false },
  },
  [ROBOT_DOOR_OPEN.ROUTE]: {
    [ROBOT_DOOR_OPEN.STEPS.DOOR_OPEN]: { allowDoorOpen: false },
  },
  [OPTION_SELECTION.ROUTE]: {
    [OPTION_SELECTION.STEPS.SELECT]: { allowDoorOpen: false },
  },
  [CANCEL_RUN.ROUTE]: {
    [CANCEL_RUN.STEPS.CONFIRM_CANCEL]: { allowDoorOpen: false },
  },
  [IGNORE_AND_SKIP.ROUTE]: {
    [IGNORE_AND_SKIP.STEPS.SELECT_IGNORE_KIND]: {
      allowDoorOpen: false,
    },
  },
  [FILL_MANUALLY_AND_SKIP.ROUTE]: {
    [FILL_MANUALLY_AND_SKIP.STEPS.MANUALLY_FILL]: {
      allowDoorOpen: true,
    },
    [FILL_MANUALLY_AND_SKIP.STEPS.SKIP]: { allowDoorOpen: true },
  },
  [REFILL_AND_RESUME.ROUTE]: {},
  [RETRY_STEP.ROUTE]: {
    [RETRY_STEP.STEPS.CONFIRM_RETRY]: {
      allowDoorOpen: false,
    },
  },
  [RETRY_NEW_TIPS.ROUTE]: {
    [RETRY_NEW_TIPS.STEPS.DROP_TIPS]: { allowDoorOpen: false },
    [RETRY_NEW_TIPS.STEPS.REPLACE_TIPS]: { allowDoorOpen: true },
    [RETRY_NEW_TIPS.STEPS.SELECT_TIPS]: { allowDoorOpen: true },
    [RETRY_NEW_TIPS.STEPS.RETRY]: { allowDoorOpen: true },
  },
  [RETRY_SAME_TIPS.ROUTE]: {
    [RETRY_SAME_TIPS.STEPS.RETRY]: { allowDoorOpen: true },
  },
  [SKIP_STEP_WITH_NEW_TIPS.ROUTE]: {
    [SKIP_STEP_WITH_NEW_TIPS.STEPS.DROP_TIPS]: {
      allowDoorOpen: false,
    },
    [SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS]: {
      allowDoorOpen: true,
    },
    [SKIP_STEP_WITH_NEW_TIPS.STEPS.SELECT_TIPS]: {
      allowDoorOpen: true,
    },
    [SKIP_STEP_WITH_NEW_TIPS.STEPS.SKIP]: { allowDoorOpen: true },
  },
  [SKIP_STEP_WITH_SAME_TIPS.ROUTE]: {
    [SKIP_STEP_WITH_SAME_TIPS.STEPS.SKIP]: {
      allowDoorOpen: true,
    },
  },
} as const

export const INVALID = 'INVALID' as const

/**
 * Styling
 */

export const ODD_SECTION_TITLE_STYLE = css`
  margin-bottom: ${SPACING.spacing16};
`

export const ODD_ONLY = css`
  @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
    display: none;
  }
`
export const DESKTOP_ONLY = css`
  @media (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
    display: none;
  }
`
export const FLEX_WIDTH_ALERT_INFO_STYLE = css`
  width: 41.625rem;
  @media (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
    width: 53rem;
  }
`
export const ICON_SIZE_ALERT_INFO_STYLE = css`
  width: ${SPACING.spacing40};
  height: ${SPACING.spacing40};
  @media (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
    width: ${SPACING.spacing60};
    height: ${SPACING.spacing60};
  }
`

export const BANNER_TEXT_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${ALIGN_CENTER};
  padding-top: ${SPACING.spacing12};
  width: 100%;
`

export const BANNER_TEXT_CONTENT_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};

  text-align: ${TEXT_ALIGN_CENTER};
  padding: ${SPACING.spacing40} ${SPACING.spacing40};
  grid-gap: ${SPACING.spacing16};
  width: 100%;
`
