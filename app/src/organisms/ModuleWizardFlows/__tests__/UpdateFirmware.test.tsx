import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { mockHeaterShaker } from '@opentrons/api-client'
import {
  useModulesQuery,
  useUpdateModuleMutation,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { mockAttachedPipetteInformation } from '/app/resources/instruments/__fixtures__'

import { UpdateFirmware } from '../UpdateFirmware'

import type { ComponentProps } from 'react'
import type { AttachedModule } from '@opentrons/api-client'
import type { IdentifyColor } from '@opentrons/shared-data'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const render = (props: ComponentProps<typeof UpdateFirmware>) => {
  return renderWithProviders(<UpdateFirmware {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('UpdateFirmware', () => {
  let updateModule: ReturnType<typeof vi.fn>
  let reset: ReturnType<typeof vi.fn>
  let sendIdentifyModule: (
    module: AttachedModule,
    start: boolean,
    color?: IdentifyColor
  ) => void
  let props: React.ComponentProps<typeof UpdateFirmware>

  const mockMutation = (overrides: Record<string, unknown> = {}): void => {
    vi.mocked(useUpdateModuleMutation).mockReturnValue({
      updateModule,
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      reset,
      ...overrides,
    } as any)
  }

  beforeEach(() => {
    vi.useFakeTimers()
    updateModule = vi.fn()
    reset = vi.fn()
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
      isDoorOpenError: false,
      setIsDoorOpenError: vi.fn(),
      dismissDoorOpenError: vi.fn(),
      isOnDevice: false,
      maintenanceRunId: '123',
      patchModuleAfterUpdate: vi.fn(),
      sendIdentifyModule,
      setExitCleanupCommands: vi.fn(),
    }
    mockMutation()
    vi.mocked(useModulesQuery).mockReturnValue({ data: undefined } as any)
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

  it('should call updateModule when update firmware button is clicked', () => {
    render(props)
    act(() => {
      vi.advanceTimersByTime(1001)
    })
    const updateButton = screen.getByRole('button', { name: 'Install update' })
    fireEvent.click(updateButton)
    expect(updateModule).toBeCalledWith(mockHeaterShaker.serialNumber)
  })

  it('should render in progress when mutation is loading', () => {
    mockMutation({ isLoading: true })
    render(props)
    act(() => {
      vi.advanceTimersByTime(1001)
    })
    screen.getByText('Installing latest firmware')
  })

  it('should call proceed when mutation succeeds and module has no available update', () => {
    vi.mocked(useModulesQuery).mockReturnValue({
      data: {
        data: [
          {
            serialNumber: mockHeaterShaker.serialNumber,
            hasAvailableUpdate: false,
          } as any,
        ],
      } as any,
    } as any)
    mockMutation({ isSuccess: true })
    render(props)
    screen.getByText('Checking Heater-Shaker Module GEN1 firmware')
    expect(props.patchModuleAfterUpdate).toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(2001)
    })
    expect(props.proceed).toHaveBeenCalled()
  })

  it('should call setErrorMessage when mutation fails', () => {
    mockMutation({
      isError: true,
      error: { message: 'Unable to update firmware' },
    })
    render(props)
    expect(props.setErrorMessage).toHaveBeenCalledWith(
      'Unable to update firmware'
    )
    expect(reset).toHaveBeenCalled()
  })
})
