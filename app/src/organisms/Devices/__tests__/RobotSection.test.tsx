import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { RobotCard } from '../RobotCard'
import { RobotSection } from '../RobotSection'

jest.mock('../RobotCard')

const mockRobotCard = RobotCard as jest.MockedFunction<typeof RobotCard>

const render = () => {
  return renderWithProviders(
    <RobotSection
      robots={[mockConnectableRobot, mockReachableRobot, mockUnreachableRobot]}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSection', () => {
  beforeEach(() => {
    mockRobotCard.mockReturnValue(<div>Mock RobotCard</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a RobotCard for each robot', () => {
    const [{ getAllByText }] = render()

    expect(getAllByText('Mock RobotCard')).toHaveLength(3)
    expect(mockRobotCard).toBeCalledTimes(3)
  })
})
