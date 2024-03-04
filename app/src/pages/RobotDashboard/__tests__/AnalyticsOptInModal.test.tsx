import * as React from 'react'
import { vi, it, describe, expect, beforeEach } from 'vitest'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'

import { i18n } from '../../../i18n'
import { updateConfigValue } from '../../../redux/config'
import { getLocalRobot } from '../../../redux/discovery'
import { updateSetting } from '../../../redux/robot-settings'
import { AnalyticsOptInModal } from '../AnalyticsOptInModal'

import type { DiscoveredRobot } from '../../../redux/discovery/types'

vi.mock('../../../redux/config')
vi.mock('../../../redux/discovery')
vi.mock('../../../redux/robot-settings')

const render = (props: React.ComponentProps<typeof AnalyticsOptInModal>) => {
  return renderWithProviders(<AnalyticsOptInModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('AnalyticsOptInModal', () => {
  let props: React.ComponentProps<typeof AnalyticsOptInModal>

  beforeEach(() => {
    props = {
      setShowAnalyticsOptInModal: vi.fn(),
    }
    vi.mocked(getLocalRobot).mockReturnValue({
      name: 'Otie',
    } as DiscoveredRobot)
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
    fireEvent.click(getByText('Opt out'))

    expect(vi.mocked(updateConfigValue)).toHaveBeenCalledWith(
      'analytics.optedIn',
      false
    )
    expect(vi.mocked(updateSetting)).toHaveBeenCalledWith(
      'Otie',
      'disableLogAggregation',
      true
    )
    expect(props.setShowAnalyticsOptInModal).toHaveBeenCalled()
  })

  it('should call a mock function when tapping out in button', () => {
    const [{ getByText }] = render(props)
    fireEvent.click(getByText('Opt in'))

    expect(vi.mocked(updateConfigValue)).toHaveBeenCalledWith(
      'analytics.optedIn',
      true
    )
    expect(vi.mocked(updateSetting)).toHaveBeenCalledWith(
      'Otie',
      'disableLogAggregation',
      true
    )
    expect(props.setShowAnalyticsOptInModal).toHaveBeenCalled()
  })
})
