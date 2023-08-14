import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'
import { useEstopQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { EstopMissingModal } from '../EstopMissingModal'
import { EstopPressedModal } from '../EstopPressedModal'
import { useIsUnboxingFlowOngoing } from '../../RobotSettingsDashboard/NetworkSettings/hooks'
import {
  ENGAGED,
  LOGICALLY_ENGAGED,
  NOT_PRESENT,
  PHYSICALLY_ENGAGED,
} from '../constants'
import { getLocalRobot } from '../../../redux/discovery'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import { EstopTakeover } from '../EstopTakeover'

jest.mock('@opentrons/react-api-client')
jest.mock('../EstopMissingModal')
jest.mock('../EstopPressedModal')
jest.mock('../../RobotSettingsDashboard/NetworkSettings/hooks')
jest.mock('../../../redux/discovery')

const mockPressed = {
  data: {
    status: PHYSICALLY_ENGAGED,
    leftEstopPhysicalStatus: ENGAGED,
    rightEstopPhysicalStatus: NOT_PRESENT,
  },
}

const mockUseEstopQuery = useEstopQuery as jest.MockedFunction<
  typeof useEstopQuery
>
const mockEstopMissingModal = EstopMissingModal as jest.MockedFunction<
  typeof EstopMissingModal
>
const mockEstopPressedModal = EstopPressedModal as jest.MockedFunction<
  typeof EstopPressedModal
>
const mockUseIsUnboxingFlowOngoing = useIsUnboxingFlowOngoing as jest.MockedFunction<
  typeof useIsUnboxingFlowOngoing
>
const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>

const render = (props: React.ComponentProps<typeof EstopTakeover>) => {
  return renderWithProviders(<EstopTakeover {...props} />, {
    i18nInstance: i18n,
  })
}

describe('EstopTakeover', () => {
  let props: React.ComponentProps<typeof EstopTakeover>

  beforeEach(() => {
    props = {
      robotName: 'Flex',
    }
    mockUseEstopQuery.mockReturnValue({ data: mockPressed } as any)
    mockEstopMissingModal.mockReturnValue(<div>mock EstopMissingModal</div>)
    mockEstopPressedModal.mockReturnValue(<div>mock EstopPressedModal</div>)
    mockUseIsUnboxingFlowOngoing.mockReturnValue(false)
    mockGetLocalRobot.mockReturnValue(mockConnectedRobot)
  })

  it('should render EstopPressedModal - PHYSICALLY_ENGAGED', () => {
    const [{ getByText }] = render(props)
    getByText('mock EstopPressedModal')
  })

  it('should render EstopPressedModal - LOGICALLY_ENGAGED', () => {
    mockPressed.data.status = LOGICALLY_ENGAGED
    mockUseEstopQuery.mockReturnValue({ data: mockPressed } as any)
    const [{ getByText }] = render(props)
    getByText('mock EstopPressedModal')
  })

  it('should render EstopMissingModal on Desktop app - NOT_PRESENT', () => {
    mockPressed.data.status = NOT_PRESENT
    mockPressed.data.leftEstopPhysicalStatus = NOT_PRESENT
    mockUseEstopQuery.mockReturnValue({ data: mockPressed } as any)
    const [{ getByText }] = render(props)
    getByText('mock EstopMissingModal')
  })

  it('should render EstopMissingModal on Touchscreen app - NOT_PRESENT', () => {
    mockPressed.data.status = NOT_PRESENT
    mockPressed.data.leftEstopPhysicalStatus = NOT_PRESENT
    mockUseEstopQuery.mockReturnValue({ data: mockPressed } as any)
    props = {
      robotName: undefined,
    }
    const [{ getByText }] = render(props)
    getByText('mock EstopMissingModal')
  })

  it('should not render EstopPressedModal if a user does not finish unboxing', () => {
    mockUseIsUnboxingFlowOngoing.mockReturnValue(true)
    const [{ queryByText }] = render(props)
    expect(queryByText('mock EstopPressedModal')).not.toBeInTheDocument()
  })

  it('should not render EstopMissingModal if a user does not finish unboxing', () => {
    mockUseIsUnboxingFlowOngoing.mockReturnValue(true)
    mockPressed.data.status = NOT_PRESENT
    const [{ queryByText }] = render(props)
    expect(queryByText('mock EstopMissingModal')).not.toBeInTheDocument()
  })
})
