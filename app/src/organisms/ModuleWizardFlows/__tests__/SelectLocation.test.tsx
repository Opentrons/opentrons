import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AttachedModule } from '@opentrons/api-client'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
  FAKE_STAGING_AREA_RIGHT_SLOT,
  FLEX_STACKER_V1_FIXTURE,
  getCutoutConfigReplacmentForModule,
  getCutoutFixturesForModuleModel,
  getFixtureIdByCutoutIdFromModuleAnchorCutoutId,
  replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  TEMPERATURE_MODULE_V2_FIXTURE,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { PipetteInformation } from '/app/redux/pipettes'

import { SelectLocation } from '../SelectLocation'

import type { ComponentProps } from 'react'
import type { CutoutConfig, CutoutConfigMap } from '@opentrons/shared-data'

vi.mock('@opentrons/react-api-client')
// vi.mock('@opentrons/shared-data')
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

const mockDeckConfigWithAA: CutoutConfigMap[] = [
  {
    cutoutId: 'cutoutA1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
    addressableAreaId: 'A1',
  },
  {
    cutoutId: 'cutoutB1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
    addressableAreaId: 'B1',
  },
  {
    cutoutId: 'cutoutC1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
    addressableAreaId: 'C1',
  },
  {
    cutoutId: 'cutoutD1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
    addressableAreaId: 'D1',
  },
  {
    cutoutId: 'cutoutA2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
    addressableAreaId: 'A2',
  },
  {
    cutoutId: 'cutoutB2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
    addressableAreaId: 'B2',
  },
  {
    cutoutId: 'cutoutC2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
    addressableAreaId: 'C2',
  },
  {
    cutoutId: 'cutoutD2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
    addressableAreaId: 'D2',
  },
  {
    cutoutId: 'cutoutA3',
    cutoutFixtureId: FAKE_STAGING_AREA_RIGHT_SLOT,
    addressableAreaId: 'A3',
  },
  {
    cutoutId: 'cutoutB3',
    cutoutFixtureId: FAKE_STAGING_AREA_RIGHT_SLOT,
    addressableAreaId: 'B3',
  },
  {
    cutoutId: 'cutoutC3',
    cutoutFixtureId: FAKE_STAGING_AREA_RIGHT_SLOT,
    addressableAreaId: 'C3',
  },
  {
    cutoutId: 'cutoutD3',
    cutoutFixtureId: FAKE_STAGING_AREA_RIGHT_SLOT,
    addressableAreaId: 'D3',
  },
]

const attachedModule: Partial<AttachedModule> = {
  moduleModel: 'temperatureModuleV2',
  serialNumber: 'test123',
}
const RUN_ID_1: string = 'mock_run_1'
const mockUpdateDeckConfiguration = vi.fn()

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
  })

  it('should call updateDeckConfig with tempDeck', async () => {
    render(props)
    console.log(screen.getByTestId('D1'))

    fireEvent.click(screen.getByTestId('D3'))
    const mockUpdatedDeckConfig = mockSimpleDeckConfig.map(config => {
      if (config.cutoutId == 'cutoutD3') {
        config.cutoutFixtureId = 'temperatureModuleV2'
        config.opentronsModuleSerialNumber = 'test123'
      }
      return config
    })

    expect(mockUpdateDeckConfiguration).toHaveBeenCalledWith(
      mockUpdatedDeckConfig
    )
  })
})
