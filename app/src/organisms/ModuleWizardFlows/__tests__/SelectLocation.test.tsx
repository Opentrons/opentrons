import { UseQueryResult } from 'react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AttachedModule } from '@opentrons/api-client'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
  FLEX_STACKER_V1_FIXTURE,
  getAAForModuleFixture,
  getFixtureIdByCutoutIdFromModuleAnchorCutoutId,
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
const mockDeckConfig: DeckConfiguration = [mockStacker]
const attachedModule: Partial<AttachedModule> = {
  moduleModel: 'temperatureModuleV2',
}
const RUN_ID_1: string = 'mock_run_1'
describe('getCutoutConfigReplacment', () => {
  let props: ComponentProps<typeof SelectLocation>

  beforeEach(() => {
    const myMock = vi.fn()
    const mockGetCutoutConfigReplacment = vi.fn()
    props = {
      proceed: vi.fn(),
      goBack: vi.fn,
      restartSetup: vi.fn(),
      isRobotMoving: false,
      isModuleUpdating: false,
      setIsModuleUpdating: vi.fn(),
      attachedModule: attachedModule as AttachedModule,
      deckConfig: mockDeckConfig,
      createMaintenanceRun: vi.fn(),
      setErrorMessage: vi.fn(),
      maintenanceRunId: RUN_ID_1,
      isLoadedInRun: true,
      isOnDevice: false,
      errorMessage: '',
      attachedPipette: {} as PipetteInformation,
    }
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: myMock,
    } as any)
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue(({
      data: [],
    } as unknown) as UseQueryResult<DeckConfiguration>)

    vi.mocked(getFixtureIdByCutoutIdFromModuleAnchorCutoutId)
  })

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
