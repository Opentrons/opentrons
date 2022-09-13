import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import * as Sessions from '../../../../redux/sessions'
import { i18n } from '../../../../i18n'
import { Introduction } from '../'
import { mockCalibrationCheckLabware } from '../../../../redux/sessions/__fixtures__'

const render = (
  props: Partial<React.ComponentProps<typeof Introduction>> = {}
) => {
  return renderWithProviders(
    <Introduction
      sendCommands={jest.fn()}
      cleanUpAndExit={jest.fn()}
      tipRack={mockCalibrationCheckLabware}
      isMulti={false}
      mount="left"
      currentStep={Sessions.CHECK_STEP_LABWARE_LOADED}
      sessionType={Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK}
      {...props}
    />,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('Introduction', () => {
  it('renders correct text', () => {
    const { getByRole, queryByRole } = render()
    getByRole('heading', { name: 'Before you begin' })
    getByRole('button', { name: 'Get started' })
    getByRole('link', { name: 'Need help?' })
    expect(queryByRole('button', { name: 'Change tip rack' })).toBe(null)
  })
  it('renders change tip rack button if deck calibration', () => {
    const { getByRole } = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
    })
    getByRole('button', { name: 'Change tip rack' })
  })
})
