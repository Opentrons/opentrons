import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useModulesQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useModuleApiRequests } from '/app/organisms/ModuleCard/utils'
import { mockHeaterShaker } from '/app/redux/modules/__fixtures__'
import { mockAttachedPipetteInformation } from '/app/redux/pipettes/__fixtures__'
import {
  dismissRequest,
  FAILURE,
  getRequestById,
  PENDING,
  SUCCESS,
  useDispatchApiRequest,
} from '/app/redux/robot-api'

import { useSendIdentifyModule } from '../hooks'
import { UpdateFirmware } from '../UpdateFirmware'

import type { ComponentProps } from 'react'
import type { AttachedModule } from '@opentrons/api-client'
import type { IdentifyColor } from '@opentrons/shared-data'
import type { DispatchApiRequestType } from '/app/redux/robot-api'
import type { RequestState } from '/app/redux/robot-api/types'
import type { State } from '/app/redux/types'

vi.mock('/app/redux/robot-api')
vi.mock('/app/organisms/ModuleCard/utils')
vi.mock('/app/organisms/ModuleWizardFlows/hooks.tsx')
vi.mock('@opentrons/react-api-client')

const LAST_ID = 'lastRequestId'
const ROBOT_NAME = 'mockRobotName'

const render = (props: ComponentProps<typeof UpdateFirmware>) => {
  return renderWithProviders(<UpdateFirmware {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('UpdateFirmware', () => {
  let dispatchApiRequest: DispatchApiRequestType
  let handleModuleApiRequests: (robotName: string, serial: string) => void
  let sendIdentifyModule: (
    module: AttachedModule,
    start: boolean,
    color?: IdentifyColor
  ) => void
  let props: React.ComponentProps<typeof UpdateFirmware>
  beforeEach(() => {
    vi.useFakeTimers()
    dispatchApiRequest = vi.fn()
    handleModuleApiRequests = vi.fn()
    sendIdentifyModule = vi.fn()
    props = {
      proceed: vi.fn(),
      goBack: vi.fn(),
      restartSetup: vi.fn(),
      chainRunCommands: vi.fn(),
      isRobotMoving: false,
      isModuleUpdating: false,
      setIsModuleUpdating: vi.fn(),
      attachedModule: mockHeaterShaker,
      attachedPipette: mockAttachedPipetteInformation,
      errorMessage: null,
      setErrorMessage: vi.fn(),
      isOnDevice: false,
      robotName: ROBOT_NAME,
      maintenanceRunId: '123',
      patchModuleAfterUpdate: vi.fn(),
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
    vi.mocked(useSendIdentifyModule).mockReturnValue(sendIdentifyModule)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.resetAllMocks()
  })

  it('should render update found screen when hasAvailableUpdate is true', () => {
    render(props)
    act(() => {
      vi.advanceTimersByTime(1001)
    })
    screen.getByText('Firmware update found')
    screen.getByText(
      'Update to the latest firmware for the Heater-Shaker Module GEN1 before proceeding'
    )
    screen.getByText('Install update')
  })

  it('should render firmware up to date screen when hasAvailableUpdate is false and call proceed', async () => {
    props = {
      ...props,
      attachedModule: { ...mockHeaterShaker, hasAvailableUpdate: false },
    }
    render(props)
    act(() => {
      vi.advanceTimersByTime(1001)
    })
    screen.getByText('Heater-Shaker Module GEN1 firmware up to date.')
    act(() => {
      vi.advanceTimersByTime(2001)
    })
    expect(props.proceed).toHaveBeenCalled()
  })

  it('should call handleModuleApiRequests when update firmware button is clicked', () => {
    render(props)
    act(() => {
      vi.advanceTimersByTime(1001)
    })
    const updateButton = screen.getByRole('button', { name: 'Install update' })
    fireEvent.click(updateButton)
    expect(handleModuleApiRequests).toBeCalledWith(
      ROBOT_NAME,
      mockHeaterShaker.serialNumber
    )
  })

  it('should render in progress when request status is PENDING', () => {
    when(getRequestById)
      .calledWith({} as State, LAST_ID)
      .thenReturn({ status: PENDING } as RequestState)
    render(props)
    act(() => {
      vi.advanceTimersByTime(1001)
    })
    screen.getByText('Installing latest firmware')
  })

  it('should call proceed when request status is SUCCESS', () => {
    vi.mocked(useModulesQuery).mockReturnValue({
      data: {
        data: [
          {
            serialNumber: mockHeaterShaker.serialNumber,
          } as any,
        ],
      } as any,
    } as any)
    when(getRequestById)
      .calledWith({} as State, LAST_ID)
      .thenReturn({ status: SUCCESS } as RequestState)
    render(props)
    screen.getByText('Checking Heater-Shaker Module GEN1 firmware')
    expect(props.patchModuleAfterUpdate).toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(2001)
    })
    expect(props.proceed).toHaveBeenCalled()
  })

  it('should call setErrorMessage and dismissRequest when request status is FAILURE', () => {
    when(getRequestById)
      .calledWith({} as State, LAST_ID)
      .thenReturn({ status: FAILURE } as RequestState)
    render(props)
    expect(props.setErrorMessage).toHaveBeenCalledWith(
      'Unable to update firmware'
    )
    expect(dismissRequest).toHaveBeenCalledWith(LAST_ID)
  })
})
