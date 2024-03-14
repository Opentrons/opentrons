import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { vi, describe, beforeEach, afterEach, expect, it } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { toggleAnalyticsOptedIn } from '../../../redux/analytics'
import { getRobotSettings, updateSetting } from '../../../redux/robot-settings'

import { Privacy } from '../Privacy'

vi.mock('../../../redux/analytics')
vi.mock('../../../redux/robot-settings')

const render = (props: React.ComponentProps<typeof Privacy>) => {
  return renderWithProviders(<Privacy {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Privacy', () => {
  let props: React.ComponentProps<typeof Privacy>
  beforeEach(() => {
    props = {
      robotName: 'Otie',
      setCurrentOption: vi.fn(),
    }
    vi.mocked(getRobotSettings).mockReturnValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Privacy')
    screen.getByText(
      'Opentrons cares about your privacy. We anonymize all data and only use it to improve our products.'
    )
    screen.getByText('Share robot logs')
    screen.getByText('Data on actions the robot does, like running protocols.')
    screen.getByText('Share display usage')
    screen.getByText('Data on how you interact with the touchscreen on Flex.')
  })

  it('should toggle display usage sharing on click', () => {
    render(props)
    fireEvent.click(screen.getByText('Share display usage'))
    expect(vi.mocked(toggleAnalyticsOptedIn)).toBeCalled()
  })

  it('should toggle robot logs sharing on click', () => {
    render(props)
    fireEvent.click(screen.getByText('Share robot logs'))
    expect(vi.mocked(updateSetting)).toBeCalledWith(
      'Otie',
      'disableLogAggregation',
      true
    )
  })
})
