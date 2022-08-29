import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { InvalidationWarning } from '../InvalidationWarning'

const render = () => {
  return renderWithProviders(<InvalidationWarning />, {
    i18nInstance: i18n,
  })[0]
}

describe('InvalidationWarning', () => {
  it('renders correct text', () => {
    const { getByText } = render()
    getByText("This tip was used to calibrate this pipette’s offset. Recalibrating this tip’s length will invalidate this pipette’s offset. If you recalibrate this tip length, you will need to recalibrate this pipette offset afterwards.You don’t have a tip length saved with this pipette yet. You will need to calibrate tip length before calibrating your pipette offset.")
  })
})
