import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { FLEX_STACKER_V1_FIXTURE } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useModuleApiRequests } from '/app/organisms/ModuleCard/utils'
import { mockFlexStacker } from '/app/redux/modules/__fixtures__'
import { mockAttachedPipetteInformation } from '/app/redux/pipettes/__fixtures__'
import { getRequestById, useDispatchApiRequest } from '/app/redux/robot-api'

import { CloseDoor } from '../CloseStackerDoor'
import { InstallShuttle } from '../InstallShuttle'

import type { ComponentProps } from 'react'
import type { CutoutConfig, DeckConfiguration } from '@opentrons/shared-data'
import type { DispatchApiRequestType } from '/app/redux/robot-api'
import type { RequestState } from '/app/redux/robot-api/types'
import type { State } from '/app/redux/types'

vi.mock('/app/redux/robot-api')
vi.mock('/app/organisms/ModuleCard/utils')

const LAST_ID = 'lastRequestId'

const render = (props: ComponentProps<typeof CloseDoor>) => {
  return renderWithProviders(<CloseDoor {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const install_render = (props: ComponentProps<typeof InstallShuttle>) => {
  return renderWithProviders(<InstallShuttle {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockStacker: CutoutConfig = {
  cutoutId: 'cutoutD3',
  cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
  opentronsModuleSerialNumber: 'fsm123',
}
const mockDeckConfig: DeckConfiguration = [mockStacker]

describe('CloseDoorInstallShuttle', () => {
  let dispatchApiRequest: DispatchApiRequestType
  let handleModuleApiRequests: (robotName: string, serial: string) => void
  let props: React.ComponentProps<typeof CloseDoor>
  beforeEach(() => {
    vi.useFakeTimers()
    dispatchApiRequest = vi.fn()
    handleModuleApiRequests = vi.fn()
    props = {
      proceed: vi.fn(),
      goBack: vi.fn(),
      chainRunCommands: vi.fn().mockResolvedValue(undefined),
      isRobotMoving: false,
      attachedModule: mockFlexStacker,
      attachedPipette: mockAttachedPipetteInformation,
      errorMessage: null,
      setErrorMessage: vi.fn(),
      isOnDevice: false,
      deckConfig: mockDeckConfig,
      maintenanceRunId: null,
    }
    vi.mocked(useModuleApiRequests).mockReturnValue([
      () => LAST_ID,
      handleModuleApiRequests,
    ])
    when(getRequestById)
      .calledWith({} as State, LAST_ID)
      .thenReturn({} as RequestState)
    vi.mocked(useDispatchApiRequest).mockReturnValue([
      dispatchApiRequest,
      [LAST_ID],
    ])
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('should render the close door screen in preparation for stacke shuttle home', () => {
    render(props)
    screen.getByText('Close robot and stacker door')
    screen.getByText(
      'The robot needs to safely move to its home location before you can set the labware shuttle onto the track.'
    )
    const continueButton = screen.getByRole('button', { name: 'Continue' })
    fireEvent.click(continueButton)
  })

  it('should render the robot in motion text', async () => {
    props = {
      proceed: vi.fn(),
      goBack: vi.fn(),
      chainRunCommands: vi.fn(),
      isRobotMoving: true,
      attachedModule: mockFlexStacker,
      attachedPipette: mockAttachedPipetteInformation,
      errorMessage: null,
      setErrorMessage: vi.fn(),
      isOnDevice: false,
      deckConfig: mockDeckConfig,
      maintenanceRunId: null,
    }
    render(props)
    screen.getByText('Stand back, robot is in motion')
  })

  it('should render the install shuttle instruction screen', () => {
    install_render(props)
    screen.getByText('Place labware shuttle on track')
    screen.getByText(
      'Place the magnetic labware shuttle flush on the top of the track.'
    )
  })
})
