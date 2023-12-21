import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { updateConfigValue } from '../../../redux/config'
import { getLocalRobot } from '../../../redux/discovery'
import { updateSetting } from '../../../redux/robot-settings'
import { AnalyticsOptInModal } from '../AnalyticsOptInModal'

import type { DiscoveredRobot } from '../../../redux/discovery/types'

jest.mock('../../../../redux/config')
jest.mock('../../../../redux/discovery')
jest.mock('../../../../redux/robot-settings')

const mockUpdateConfigValue = updateConfigValue as jest.MockedFunction<
  typeof updateConfigValue
>
const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>
const mockUpdateSetting = updateSetting as jest.MockedFunction<
  typeof updateSetting
>

const render = (props: React.ComponentProps<typeof AnalyticsOptInModal>) => {
  return renderWithProviders(<AnalyticsOptInModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('AnalyticsOptInModal', () => {
  let props: React.ComponentProps<typeof AnalyticsOptInModal>

  beforeEach(() => {
    props = {
      setShowAnalyticsOptInModal: jest.fn(),
    }
    mockGetLocalRobot.mockReturnValue({ name: 'Otie' } as DiscoveredRobot)
  })

  it('should render text and button', () => {
    const [{ getByText }] = render(props)

    getByText('Want to help out Opentrons?')
    getByText(
      'Automatically send us anonymous diagnostics and usage data. We only use this information to improve our products.'
    )
    getByText('Opt out')
    getByText('Opt in')
  })

  it('should call a mock function when tapping opt out button', () => {
    const [{ getByText }] = render(props)
    getByText('Opt out').click()

    expect(mockUpdateConfigValue).toHaveBeenCalledWith(
      'analytics.optedIn',
      false
    )
    expect(mockUpdateSetting).toHaveBeenCalledWith(
      'Otie',
      'disableLogAggregation',
      true
    )
    expect(props.setShowAnalyticsOptInModal).toHaveBeenCalled()
  })

  it('should call a mock function when tapping out in button', () => {
    const [{ getByText }] = render(props)
    getByText('Opt in').click()

    expect(mockUpdateConfigValue).toHaveBeenCalledWith(
      'analytics.optedIn',
      true
    )
    expect(mockUpdateSetting).toHaveBeenCalledWith(
      'Otie',
      'disableLogAggregation',
      true
    )
    expect(props.setShowAnalyticsOptInModal).toHaveBeenCalled()
  })
})
