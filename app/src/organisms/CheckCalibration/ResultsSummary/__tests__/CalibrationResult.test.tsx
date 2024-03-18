import * as React from 'react'
import { vi, it, describe, beforeEach } from 'vitest'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { RenderResult } from '../RenderResult'
import { CalibrationResult } from '../CalibrationResult'

vi.mock('../RenderResult')

const render = (props: React.ComponentProps<typeof CalibrationResult>) => {
  return renderWithProviders(<CalibrationResult {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('PipetteCalibrationResult', () => {
  let props: React.ComponentProps<typeof CalibrationResult>

  beforeEach(() => {
    props = {
      calType: 'pipetteOffset',
      isBadCal: false,
    }
    vi.mocked(RenderResult).mockReturnValue(<div>render result</div>)
  })

  it('should render pipette offset calibration title and RenderResult - isBadCal: false', () => {
    const { getByText } = render(props)
    getByText('pipette offset calibration')
    getByText('render result')
  })

  it('should render pipette offset calibration title and RenderResult - isBadCal: true', () => {
    props.isBadCal = true
    const { getByText } = render(props)
    getByText('pipette offset calibration')
    getByText('render result')
  })

  it('should render tip length calibration title and RenderResult - isBadCal: false', () => {
    props.calType = 'tipLength'
    const { getByText } = render(props)
    getByText('tip length calibration')
    getByText('render result')
  })

  it('should render tip length calibration title and RenderResult - isBadCal: true', () => {
    props.calType = 'tipLength'
    props.isBadCal = true
    const { getByText } = render(props)
    getByText('tip length calibration')
    getByText('render result')
  })

  it('should render deck calibration title and RenderResult - isBadCal: false', () => {
    props.calType = 'deck'
    const { getByText } = render(props)
    getByText('Deck Calibration')
    getByText('render result')
  })

  it('should render deck calibration title and RenderResult - isBadCal: true', () => {
    props.calType = 'deck'
    props.isBadCal = true
    const { getByText } = render(props)
    getByText('Deck Calibration')
    getByText('render result')
  })
})
