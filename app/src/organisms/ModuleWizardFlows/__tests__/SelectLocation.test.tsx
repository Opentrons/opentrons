import { UseQueryResult } from 'react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AttachedModule } from '@opentrons/api-client'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
  FLEX_STACKER_V1_FIXTURE,
  getFixtureIdByCutoutIdFromModuleAnchorCutoutId,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  TEMPERATURE_MODULE_V2_FIXTURE,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { PipetteInformation } from '/app/redux/pipettes'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import { getCutoutConfigReplacment, SelectLocation } from '../SelectLocation'

import type { ComponentProps } from 'react'
import type { CutoutConfig, DeckConfiguration } from '@opentrons/shared-data'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/deck_configuration')
vi.mock('/app/organisms/ModuleCard/utils')
vi.mock('/app/organisms/ModuleWizardFlows/hooks.tsx')

const render = (props: ComponentProps<typeof SelectLocation>) => {
  return renderWithProviders(<SelectLocation {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockStacker: CutoutConfig = {
  cutoutId: 'cutoutD3',
  cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
  opentronsModuleSerialNumber: 'fsm123',
}

const mockTempModuleTestId: CutoutConfig = {
cutoutId: 'cutoutD1',
  cutoutFixtureId: TEMPERATURE_MODULE_V2_FIXTURE,
  opentronsModuleSerialNumber: 'test123',
}
const mockTempModule: CutoutConfig = {
cutoutId: 'cutoutD3',
  cutoutFixtureId: TEMPERATURE_MODULE_V2_FIXTURE,
  opentronsModuleSerialNumber: 'test',
}
const mockDeckConfig: DeckConfiguration = [mockStacker]
const mockSimpleDeckConfig: CutoutConfig[] = [{
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
}
]
const attachedModule: Partial<AttachedModule> = {
  moduleModel: 'temperatureModuleV2',
  serialNumber: 'test123'
}
const RUN_ID_1: string = 'mock_run_1'
const mockUpdateDeckConfiguration = vi.fn()

describe('', () => {
    let props: ComponentProps<typeof SelectLocation>

    beforeEach(() => {
        const mockUpdateDeckConfiguration = vi.fn()
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

  it('should call updateDeckConfig with tempDeck', async () => {
    render(props)
    console.log(screen.getByTestId('D1'))
    
    fireEvent.click(screen.getByTestId('D3'))
    //     await waitFor(() =>
        expect(mockUpdateDeckConfiguration).toHaveBeenCalledWith({
          cutoutId: 'CutoutD3',
          cutoutFixtureId: 'temperatureModuleV2',
            opentronsModuleSerialNumber: 'test123'
        })
    // )
  })
})

describe('getCutoutConfigReplacment', () => {
  it('should get temp module replacment fixture', () => {
    expect(
      getCutoutConfigReplacment(
        'cutoutD3',
        'temperatureModuleV2',
        'temperatureModuleV2',
        mockDeckConfig
      )
    ).toStrictEqual({
      cutoutId: 'cutoutD3',
      cutoutFixtureId: 'temperatureModuleV2',
      opentronsModuleSerialNumber: undefined,
    })
  })

  it('should get flex module replacment fixture', () => {
    expect(
      getCutoutConfigReplacment(
        'cutoutC3',
        'flexStackerModuleV1',
        'flexStackerModuleV1',
        mockDeckConfig
      )
    ).toStrictEqual({
      cutoutId: 'cutoutC3',
      cutoutFixtureId: 'flexStackerModuleV1',
      opentronsModuleSerialNumber: undefined,
    })
  })
})
