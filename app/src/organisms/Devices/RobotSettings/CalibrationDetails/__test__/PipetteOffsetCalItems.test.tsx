import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../../i18n'
import { PipetteOffsetCalItems } from '../PipetteOffsetCalItems'

const render = (
  props: React.ComponentProps<typeof PipetteOffsetCalItems>
): JSX.Element => {
  return renderWithProviders(<PipetteOffsetCalItems {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('PipetteOffsetCalItems', () => {
  it('should render table headers', () => {})

  it('should render pipette offset calibrations data', () => {})

  it('should render icon and text when calibration missing', () => {})

  it('should render icon and test when calibration recommended', () => {})
})
