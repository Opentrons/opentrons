import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { FLEX_STACKER_V1_FIXTURE } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useModuleApiRequests } from '/app/organisms/ModuleCard/utils'
import {
  mockFlexStacker,
  mockFlexStackerMissingShuttle,
} from '/app/redux/modules/__fixtures__'
import { getRequestById, useDispatchApiRequest } from '/app/redux/robot-api'
import { mockAttachedPipetteInformation } from '/app/resources/instruments/__fixtures__'

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

const installRender = (props: ComponentProps<typeof InstallShuttle>) => {
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
      restartSetup: vi.fn(),
      chainRunCommands: vi.fn().mockResolvedValue(undefined),
      isRobotMoving: false,
      isModuleUpdating: false,
      setIsModuleUpdating: vi.fn(),
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
      restartSetup: vi.fn(),
      chainRunCommands: vi.fn(),
      isRobotMoving: true,
      isModuleUpdating: false,
      setIsModuleUpdating: vi.fn(),
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

  it('should render the install shuttle instruction screen followed by a fail screen', () => {
    const installProps = {
      proceed: vi.fn(),
      goBack: vi.fn(),
      chainRunCommands: vi.fn(),
      isRobotMoving: true,
      attachedModule: mockFlexStackerMissingShuttle,
      attachedPipette: mockAttachedPipetteInformation,
      errorMessage: null,
      setErrorMessage: vi.fn(),
      isOnDevice: false,
      deckConfig: mockDeckConfig,
      maintenanceRunId: null,
      restartSetup: vi.fn(),
      isModuleUpdating: false,
      setIsModuleUpdating: vi.fn(),
      attachedModules: [mockFlexStackerMissingShuttle],
    }
    installRender(installProps)
    screen.getByText('Place labware shuttle on track')
    screen.getByText(
      'Place the magnetic labware shuttle flush on the top of the track.'
    )
    const confirmButton = screen.getByRole('button', {
      name: 'Confirm placement',
    })
    fireEvent.click(confirmButton)
    screen.getByText('Shuttle installed incorrectly')
    screen.getByText(
      'There was an issue with the install of the shuttle. Please try installing again or contact support.'
    )
  })
})
