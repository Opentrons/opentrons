import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { InvalidationWarning } from '../InvalidationWarning'
import {
  INTENT_CALIBRATE_PIPETTE_OFFSET,
  INTENT_RECALIBRATE_PIPETTE_OFFSET,
  INTENT_TIP_LENGTH_IN_PROTOCOL,
  INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
} from '../../constants'

const render = (props: React.ComponentProps<typeof InvalidationWarning>) => {
  return renderWithProviders(<InvalidationWarning {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('InvalidationWarning', () => {
  it('renders correct text for tlc in protocol intent', () => {
    const { getByText } = render({
      intent: INTENT_TIP_LENGTH_IN_PROTOCOL,
    })
    getByText("This tip was used to calibrate this pipette’s offset. Recalibrating this tip’s length will invalidate this pipette’s offset. If you recalibrate this tip length, you will need to recalibrate this pipette offset afterwards.")
  })
  it('renders correct text for tlc out of protocol intent', () => {
    const { getByText } = render({
      intent: INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
    })
    getByText("This tip was used to calibrate this pipette’s offset. Recalibrating this tip’s length will invalidate this pipette’s offset. If you recalibrate this tip length, you will need to recalibrate this pipette offset afterwards.")
  })
  it('renders correct text for pip offset cal intent', () => {
    const { getByText } = render({
      intent: INTENT_CALIBRATE_PIPETTE_OFFSET,
    })
    getByText("You don’t have a tip length saved with this pipette yet. You will need to calibrate tip length before calibrating your pipette offset.")
  })
  it('renders correct text for pip offset recal intent', () => {
    const { getByText } = render({
      intent: INTENT_RECALIBRATE_PIPETTE_OFFSET,
    })
    getByText("You don’t have a tip length saved with this pipette yet. You will need to calibrate tip length before calibrating your pipette offset.")
  })
})
