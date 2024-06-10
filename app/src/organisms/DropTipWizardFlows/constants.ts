import { css } from 'styled-components'

import { SPACING } from '@opentrons/components'

// Routing

export const BEFORE_BEGINNING = 'BEFORE_BEGINNING'
export const POSITION_AND_BLOWOUT = 'POSITION_AND_BLOWOUT' as const
export const BLOWOUT_SUCCESS = 'BLOWOUT_SUCCESS' as const
export const CHOOSE_BLOWOUT_LOCATION = 'CHOOSE_BLOWOUT_LOCATION' as const
export const CHOOSE_DROP_TIP_LOCATION = 'CHOOSE_DROP_TIP_LOCATION' as const
export const POSITION_AND_DROP_TIP = 'POSITION_AND_DROP_TIP' as const
export const DROP_TIP_SUCCESS = 'DROP_TIP_SUCCESS' as const
export const INVALID = 'INVALID' as const

const BEFORE_BEGINNING_STEPS = [BEFORE_BEGINNING]
const BLOWOUT_STEPS = [
  CHOOSE_BLOWOUT_LOCATION,
  POSITION_AND_BLOWOUT,
  BLOWOUT_SUCCESS,
]
const DROP_TIP_STEPS = [
  CHOOSE_DROP_TIP_LOCATION,
  POSITION_AND_DROP_TIP,
  DROP_TIP_SUCCESS,
]

export const DT_ROUTES = {
  BEFORE_BEGINNING: BEFORE_BEGINNING_STEPS,
  BLOWOUT: BLOWOUT_STEPS,
  DROP_TIP: DROP_TIP_STEPS,
} as const

// Setup Command Specific

export const MANAGED_PIPETTE_ID = 'managedPipetteId'

// Errors

export const DROP_TIP_SPECIAL_ERROR_TYPES = {
  MUST_HOME_ERROR: 'MustHomeError',
} as const

// Fixit Styling
export const FIXIT_TYPE_STYLES = css`
  padding: ${SPACING.spacing32};
  grid-gap: ${SPACING.spacing32};
`
