import { afterEach, beforeEach, describe, it, vi, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FLEX_STACKER_V1_FIXTURE, getAAForModuleFixture } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useModuleApiRequests } from '/app/organisms/ModuleCard/utils'
import {
  mockFlexStacker,
  mockFlexStackerMissingShuttle,
} from '/app/redux/modules/__fixtures__'
import { mockAttachedPipetteInformation } from '/app/redux/pipettes/__fixtures__'
import { getRequestById, useDispatchApiRequest } from '/app/redux/robot-api'

import { CloseDoor } from '../CloseStackerDoor'
import { InstallShuttle } from '../InstallShuttle'

import type { ComponentProps } from 'react'
import type { CutoutConfig, DeckConfiguration } from '@opentrons/shared-data'
import type { DispatchApiRequestType } from '/app/redux/robot-api'
import type { RequestState } from '/app/redux/robot-api/types'
import type { State } from '/app/redux/types'
import { SelectLocation } from '../SelectLocation'
import { AttachedModule, updateDeckConfiguration } from '@opentrons/api-client'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import { PipetteInformation } from '/app/redux/pipettes'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { UseQueryResult } from 'react-query'

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
    moduleModel: 'temperatureModuleV2'
}
const RUN_ID_1: string = 'mock_run_1'
describe('handleAddFixture', () => {
  let props: ComponentProps<typeof SelectLocation>

  beforeEach(() => {
const myMock = vi.fn();
const mockGetAAForModuleFixture = vi.fn()
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
        attachedPipette: {} as PipetteInformation
    }
    const mock = vi.mocked(useUpdateDeckConfigurationMutation)
    mock.mockReturnValue({
      updateDeckConfiguration: myMock,
    } as any)
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue(({
      data: [],
    } as unknown) as UseQueryResult<DeckConfiguration>)
    vi.mocked(getAAForModuleFixture)
  })

  it('should update deck config with temp module fixture', async () => {
    render(props)
    const handleAddFixture = vi.fn()
    fireEvent.click(screen.getByTestId('D3'))
    expect(handleAddFixture).toBeCalledWith('D3')

  })
})
