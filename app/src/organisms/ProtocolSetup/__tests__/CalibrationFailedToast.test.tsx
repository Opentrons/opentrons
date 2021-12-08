import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CalibrationFailedToast } from '../CalibrationFailedToast'

const render = (props: React.ComponentProps<typeof CalibrationFailedToast>) => {
  return renderWithProviders(<CalibrationFailedToast {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('CalibrationFailedToast', () => {
  let props: React.ComponentProps<typeof CalibrationFailedToast>

  beforeEach(() => {
    props = {
      calibrationStatus: {
        complete: false,
        reason: 'calibrate_tiprack_failure_reason',
      },
    }
  })

  it('renders an alert item with pipette offset calibration error', () => {
    const { getByText } = render(props)
    getByText(
      'Tip Length Calibration failed. calibrate_tiprack_failure_reason Contact Opentrons Support if the issue persists.'
    )
  })
  it('renders an alert item with tiplength calibration error', () => {
    props = {
      calibrationStatus: {
        complete: false,
        reason: 'calibrate_pipette_failure_reason',
      },
    }
    const { getByText } = render(props)
    expect(
      getByText(
        'Pipette Offset Calibration failed. calibrate_pipette_failure_reason Contact Opentrons Support if the issue persists.'
      )
    ).toHaveStyle('backgroundColor: c-error-light')
  })
  it('renders null if calibrationStatus === true', () => {
    props = { calibrationStatus: { complete: true } }
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
})
