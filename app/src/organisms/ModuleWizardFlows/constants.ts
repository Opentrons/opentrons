import { css } from 'styled-components'
import { RESPONSIVENESS, TYPOGRAPHY } from '@opentrons/components'

export const SECTIONS = {
  BEFORE_BEGINNING: 'BEFORE_BEGINNING',
  FIRMWARE_UPDATE: 'FIRMWARE_UPDATE',
  SELECT_LOCATION: 'SELECT_LOCATION',
  PLACE_ADAPTER: 'PLACE_ADAPTER',
  ATTACH_PROBE: 'ATTACH_PROBE',
  DETACH_PROBE: 'DETACH_PROBE',
  SUCCESS: 'SUCCESS',
} as const

export const FLOWS = {
  CALIBRATE: 'CALIBRATE',
}

export const CAL_PIN_LOADNAME = 'calibration_pin' as const
export const SCREWDRIVER_LOADNAME = 'hex_screwdriver' as const

export const LEFT_SLOTS: Array<string> = ['A1', 'B1', 'C1', 'D1']

export const BODY_STYLE = css`
  ${TYPOGRAPHY.Regular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`
