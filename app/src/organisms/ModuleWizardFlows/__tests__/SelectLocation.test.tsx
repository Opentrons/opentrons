import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
  FLEX_STACKER_MODULE_V1,
  FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
  MAGNETIC_BLOCK_V1_FIXTURE,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  TEMPERATURE_MODULE_V2_FIXTURE,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import { SelectLocation } from '../SelectLocation'

import type { ComponentProps } from 'react'
import type { UseQueryResult } from 'react-query'
import type { AttachedModule } from '@opentrons/api-client'
import type { CutoutConfig, DeckConfiguration } from '@opentrons/shared-data'
import type { PipetteInformation } from '/app/redux/pipettes'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/deck_configuration')
vi.mock('/app/organisms/ModuleCard/utils')
vi.mock('/app/organisms/ModuleWizardFlows/hooks.tsx')

const render = (props: ComponentProps<typeof SelectLocation>) => {
  return renderWithProviders(<SelectLocation {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockSimpleDeckConfig: CutoutConfig[] = [
  {
    cutoutId: 'cutoutA1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutB1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutC1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutD1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutA2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutB2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutC2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutD2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutA3',
    cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutB3',
    cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutC3',
    cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutD3',
    cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
  },
]

const attachedModule: Partial<AttachedModule> = {
  moduleModel: 'temperatureModuleV2',
  serialNumber: 'test123',
}
const RUN_ID_1: string = 'mock_run_1'
const mockUpdateDeckConfiguration = vi.fn()

describe('SelectLocation', () => {
  let props: ComponentProps<typeof SelectLocation>

  beforeEach(() => {
    props = {
      proceed: vi.fn(),
      goBack: vi.fn,
      restartSetup: vi.fn(),
      isRobotMoving: false,
      isModuleUpdating: false,
      setIsModuleUpdating: vi.fn(),
      attachedModule: attachedModule as AttachedModule,
      deckConfig: mockSimpleDeckConfig,
      createMaintenanceRun: vi.fn(),
      setErrorMessage: vi.fn(),
      maintenanceRunId: RUN_ID_1,
      isLoadedInRun: false,
      isOnDevice: false,
      errorMessage: '',
      attachedPipette: {} as PipetteInformation,
    }
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue(({
      data: [],
    } as unknown) as UseQueryResult<DeckConfiguration>)
  })

  it('should render text and buttons slot D3', async () => {
    render(props)
    screen.getByText('Select module location')
    screen.getByText(
      'Select the slot where you installed the Temperature Module GEN2 on the deck map to the right. The location must be correct for successful calibration.'
    )

    const confirmBtn = screen.getByText('Confirm location')
    expect(confirmBtn).toBeDisabled()

    // Click on A1 slot (using the correct test ID)
    fireEvent.click(screen.getByTestId('A1'))

    await waitFor(() => {
      expect(screen.getByText('Confirm location')).toBeEnabled()
    })

    fireEvent.click(screen.getByText('Confirm location'))

    await waitFor(() => {
      expect(props.proceed).toHaveBeenCalled()
    })
  })
})

describe('handleAddFixture', () => {
  let props: ComponentProps<typeof SelectLocation>

  beforeEach(() => {
    props = {
      proceed: vi.fn(),
      goBack: vi.fn,
      restartSetup: vi.fn(),
      isRobotMoving: false,
      isModuleUpdating: false,
      setIsModuleUpdating: vi.fn(),
      attachedModule: attachedModule as AttachedModule,
      deckConfig: mockSimpleDeckConfig,
      createMaintenanceRun: vi.fn(),
      setErrorMessage: vi.fn(),
      maintenanceRunId: RUN_ID_1,
      isLoadedInRun: false,
      isOnDevice: false,
      errorMessage: '',
      attachedPipette: {} as PipetteInformation,
    }
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue(({
      data: [],
    } as unknown) as UseQueryResult<DeckConfiguration>)
  })

  it('should call updateDeckConfig with flex and mag block fixture', async () => {
    const mockDeckConfigWithMagBlock = mockSimpleDeckConfig.map(dc => {
      if (dc.cutoutId === 'cutoutD1') {
        dc.cutoutFixtureId = MAGNETIC_BLOCK_V1_FIXTURE
      }
      return dc
    })

    const updatedProps = { ...props, deckConfig: mockDeckConfigWithMagBlock }
    render(updatedProps)

    fireEvent.click(screen.getByTestId('C1'))
    const mockUpdatedDeckConfig = mockSimpleDeckConfig.map(config => {
      if (config.cutoutId === 'cutoutC1') {
        config.cutoutFixtureId = 'temperatureModuleV2'
        config.opentronsModuleSerialNumber = 'test123'
      }
      return config
    })

    expect(mockUpdateDeckConfiguration).toHaveBeenCalledWith(
      mockUpdatedDeckConfig
    )
  })

  it('should call updateDeckConfig with combo fixture', async () => {
    props.attachedModule = {
      moduleModel: FLEX_STACKER_MODULE_V1,
      serialNumber: 'test123',
    } as AttachedModule
    const mockUpdatedDeckConfig = mockSimpleDeckConfig.map(config => {
      if (config.cutoutId === 'cutoutD3') {
        config.cutoutFixtureId = MAGNETIC_BLOCK_V1_FIXTURE
      }
      return config
    })
    props.deckConfig = mockUpdatedDeckConfig
    render(props)
    console.log("screen.getByTestId('D3'): ", screen.getByTestId('D3'))

    fireEvent.click(screen.getByTestId('D3'))
    const mockStackerUpdatedDeckConfig = mockSimpleDeckConfig.map(config => {
      if (config.cutoutId === 'cutoutD3') {
        config.cutoutFixtureId = FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE
        config.opentronsModuleSerialNumber = 'test123'
      }
      return config
    })

    expect(mockUpdateDeckConfiguration).toHaveBeenCalledWith(
      mockStackerUpdatedDeckConfig
    )
  })
})

describe('handleRemoveFixture', () => {
  let props: ComponentProps<typeof SelectLocation>

  beforeEach(() => {
    props = {
      proceed: vi.fn(),
      goBack: vi.fn,
      restartSetup: vi.fn(),
      isRobotMoving: false,
      isModuleUpdating: false,
      setIsModuleUpdating: vi.fn(),
      attachedModule: attachedModule as AttachedModule,
      deckConfig: mockSimpleDeckConfig,
      createMaintenanceRun: vi.fn(),
      setErrorMessage: vi.fn(),
      maintenanceRunId: RUN_ID_1,
      isLoadedInRun: false,
      isOnDevice: false,
      errorMessage: '',
      attachedPipette: {} as PipetteInformation,
    }
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
  })

  it('should call updateDeckConfig without tempDeck', async () => {
    render(props)

    fireEvent.click(screen.getByTestId('A1'))
    const mockUpdatedDeckConfig = mockSimpleDeckConfig.map(config => {
      if (config.cutoutId === 'cutoutA1') {
        config.cutoutFixtureId = TEMPERATURE_MODULE_V2_FIXTURE
        config.opentronsModuleSerialNumber = 'test123'
      }
      return config
    })
    expect(mockUpdateDeckConfiguration).toHaveBeenCalledWith(
      mockUpdatedDeckConfig
    )
    // click twice to undo
    fireEvent.click(screen.getByTestId('A1'))
    expect(mockUpdateDeckConfiguration).toHaveBeenCalledWith(
      mockSimpleDeckConfig
    )
  })
})
