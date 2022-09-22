import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { RenderResult } from '../RenderResult'
import { PipetteCalibrationResult } from '../PipetteCalibrationResult'

jest.mock('../RenderResult')

const mockRenderResult = RenderResult as jest.MockedFunction<
  typeof RenderResult
>

const render = (
  props: React.ComponentProps<typeof PipetteCalibrationResult>
) => {
  return renderWithProviders(<PipetteCalibrationResult {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('PipetteCalibrationResult', () => {
  let props: React.ComponentProps<typeof PipetteCalibrationResult>

  beforeEach(() => {
    props = {
      isBadCal: false,
    }
    mockRenderResult.mockReturnValue(<div>render result</div>)
  })

  it('should render title and RenderResult - isBadCal: false', () => {
    const { getByText } = render(props)
    getByText('pipette offset calibration')
    getByText('render result')
  })

  it('should render title and RenderResult - isBadCal: true', () => {
    props.isBadCal = true
    const { getByText } = render(props)
    getByText('pipette offset calibration')
    getByText('render result')
  })
})
