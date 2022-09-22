import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { RenderResult } from '../RenderResult'
import { DeckCalibrationResult } from '../DeckCalibrationResult'

jest.mock('../RenderResult')

const mockRenderResult = RenderResult as jest.MockedFunction<
  typeof RenderResult
>

const render = (props: React.ComponentProps<typeof DeckCalibrationResult>) => {
  return renderWithProviders(<DeckCalibrationResult {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DeckCalibrationResult', () => {
  let props: React.ComponentProps<typeof DeckCalibrationResult>

  beforeEach(() => {
    props = {
      isBadCal: false,
    }
    mockRenderResult.mockReturnValue(<div>render result</div>)
  })

  it('should render title and RenderResult - isBadCal: false', () => {
    const { getByText } = render(props)
    getByText('Deck Calibration')
    getByText('render result')
  })

  it('should render RenderResult - isBadCal: true', () => {
    props.isBadCal = true
    const { getByText } = render(props)
    getByText('render result')
  })
})
