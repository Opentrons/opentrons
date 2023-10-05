import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { toggleAnalyticsOptedIn } from '../../../redux/analytics'
import { getRobotSettings, updateSetting } from '../../../redux/robot-settings'

import { Privacy } from '../Privacy'

jest.mock('../../../redux/analytics')
jest.mock('../../../redux/robot-settings')

const mockGetRobotSettings = getRobotSettings as jest.MockedFunction<
  typeof getRobotSettings
>
const mockUpdateSetting = updateSetting as jest.MockedFunction<
  typeof updateSetting
>
const mockToggleAnalyticsOptedIn = toggleAnalyticsOptedIn as jest.MockedFunction<
  typeof toggleAnalyticsOptedIn
>

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
      setCurrentOption: jest.fn(),
    }
    mockGetRobotSettings.mockReturnValue([])
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render text and buttons', () => {
    const [{ getByText }] = render(props)
    getByText('Privacy')
    getByText(
      'Opentrons cares about your privacy. We anonymize all data and only use it to improve our products.'
    )
    getByText('Share robot logs')
    getByText('Data on actions the robot does, like running protocols.')
    getByText('Share display usage')
    getByText('Data on how you interact with the touchscreen on Flex.')
  })

  it('should toggle display usage sharing on click', () => {
    const [{ getByText }] = render(props)

    getByText('Share display usage').click()
    expect(mockToggleAnalyticsOptedIn).toBeCalled()
  })

  it('should toggle robot logs sharing on click', () => {
    const [{ getByText }] = render(props)

    getByText('Share robot logs').click()
    expect(mockUpdateSetting).toBeCalledWith(
      'Otie',
      'disableLogAggregation',
      true
    )
  })
})
