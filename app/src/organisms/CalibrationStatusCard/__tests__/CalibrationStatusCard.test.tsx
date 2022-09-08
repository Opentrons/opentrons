import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { CalibrationStatusCard } from '..'

const render = (props: React.ComponentProps<typeof CalibrationStatusCard>) => {
  return renderWithProviders(
    <MemoryRouter>
      <CalibrationStatusCard {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('CalibrationStatusCard', () => {
  const props: React.ComponentProps<typeof CalibrationStatusCard> = {
    robotName: 'otie',
    setShowDeckCalibrationModal: showDeckCalibrationModal => {},
  }

  it('renders a calibration status title and description', () => {
    const [{ getByText }] = render(props)

    getByText('Calibration Status')
  })

  it('renders a status label', () => {
    const [{ getByText }] = render(props)
    getByText('Missing calibration data')
  })

  it('renders a "See how robot calibration works button"', () => {
    const [{ getByRole }] = render(props)
    getByRole('button', { name: 'See how robot calibration works' })
  })

  it('renders a link to launch the calibration dashboard', () => {
    const [{ getByRole }] = render(props)

    const calibrationDashboardLink = getByRole('link', {
      name: 'Launch calibration',
    })
    expect(calibrationDashboardLink.getAttribute('href')).toEqual(
      '/devices/otie/robot-settings/calibration/dashboard'
    )
  })
})
