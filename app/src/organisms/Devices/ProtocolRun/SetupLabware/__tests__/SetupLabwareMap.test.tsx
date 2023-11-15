import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { StaticRouter } from 'react-router-dom'
import {
  renderWithProviders,
  partialComponentPropsMatcher,
  LabwareRender,
  Module,
} from '@opentrons/components'
import { OT2_ROBOT_TYPE, getModuleDef2 } from '@opentrons/shared-data'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'

import { i18n } from '../../../../../i18n'
import { getAttachedProtocolModuleMatches } from '../../../../ProtocolSetupModulesAndDeck/utils'
import { LabwareInfoOverlay } from '../../LabwareInfoOverlay'
import { getLabwareRenderInfo } from '../../utils/getLabwareRenderInfo'
import { SetupLabwareMap } from '../SetupLabwareMap'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
  ModuleModel,
  ModuleType,
} from '@opentrons/shared-data'

jest.mock('@opentrons/components/src/hardware-sim/Labware/LabwareRender')
jest.mock('@opentrons/components/src/hardware-sim/Module')
jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    getModuleDef2: jest.fn(),
  }
})
jest.mock('../../../../ProtocolSetupModulesAndDeck/utils')
jest.mock('../../LabwareInfoOverlay')
jest.mock('../../utils/getLabwareRenderInfo')
jest.mock('../../utils/getModuleTypesThatRequireExtraAttention')
jest.mock('../../../../RunTimeControl/hooks')
jest.mock('../../../hooks')

const mockGetAttachedProtocolModuleMatches = getAttachedProtocolModuleMatches as jest.MockedFunction<
  typeof getAttachedProtocolModuleMatches
>
const mockGetLabwareRenderInfo = getLabwareRenderInfo as jest.MockedFunction<
  typeof getLabwareRenderInfo
>
const mockLabwareInfoOverlay = LabwareInfoOverlay as jest.MockedFunction<
  typeof LabwareInfoOverlay
>

const mockModule = Module as jest.MockedFunction<typeof Module>

const mockLabwareRender = LabwareRender as jest.MockedFunction<
  typeof LabwareRender
>

const mockGetModuleDef2 = getModuleDef2 as jest.MockedFunction<
  typeof getModuleDef2
>

const RUN_ID = '1'
const MOCK_300_UL_TIPRACK_ID = '300_ul_tiprack_id'
const MOCK_MAGNETIC_MODULE_COORDS = [10, 20, 0]
const MOCK_TC_COORDS = [20, 30, 0]
const MOCK_300_UL_TIPRACK_COORDS = [30, 40, 0]

const mockMagneticModule = {
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleType,
  labwareOffset: { x: 5, y: 5, z: 5 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  calibrationPoint: { x: 0, y: 0 },
  displayName: 'Magnetic Module',
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
  quirks: [],
}

const mockTCModule = {
  labwareOffset: { x: 3, y: 3, z: 3 },
  moduleId: 'TCModuleId',
  model: 'thermocyclerModuleV1' as ModuleModel,
  type: 'thermocyclerModuleType' as ModuleType,
}

const render = (props: React.ComponentProps<typeof SetupLabwareMap>) => {
  return renderWithProviders(
    <StaticRouter>
      <SetupLabwareMap {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('SetupLabwareMap', () => {
  beforeEach(() => {
    when(mockGetAttachedProtocolModuleMatches).mockReturnValue([])
    when(mockGetLabwareRenderInfo).mockReturnValue({})
    when(mockLabwareRender)
      .mockReturnValue(<div></div>) // this (default) empty div will be returned when LabwareRender isn't called with expected labware definition
      .calledWith(
        partialComponentPropsMatcher({
          definition: fixture_tiprack_300_ul,
        })
      )
      .mockReturnValue(
        <div>
          mock labware render of {fixture_tiprack_300_ul.metadata.displayName}
        </div>
      )

    when(mockLabwareInfoOverlay)
      .mockReturnValue(<div></div>) // this (default) empty div will be returned when LabwareInfoOverlay isn't called with expected props
      .calledWith(
        partialComponentPropsMatcher({ definition: fixture_tiprack_300_ul })
      )
      .mockReturnValue(
        <div>
          mock labware info overlay of{' '}
          {fixture_tiprack_300_ul.metadata.displayName}
        </div>
      )
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render a deck WITHOUT labware and WITHOUT modules', () => {
    expect(mockModule).not.toHaveBeenCalled()
    expect(mockLabwareRender).not.toHaveBeenCalled()
    expect(mockLabwareInfoOverlay).not.toHaveBeenCalled()
  })
  it('should render a deck WITH labware and WITHOUT modules', () => {
    when(mockGetLabwareRenderInfo).mockReturnValue({
      '300_ul_tiprack_id': {
        labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
        displayName: 'fresh tips',
        x: MOCK_300_UL_TIPRACK_COORDS[0],
        y: MOCK_300_UL_TIPRACK_COORDS[1],
        z: MOCK_300_UL_TIPRACK_COORDS[2],
        slotName: '1',
      },
    })

    const { getByText } = render({
      runId: RUN_ID,
      protocolAnalysis: ({
        commands: [],
        labware: [],
        robotType: OT2_ROBOT_TYPE,
      } as unknown) as CompletedProtocolAnalysis,
    })

    expect(mockModule).not.toHaveBeenCalled()
    expect(mockLabwareRender).toHaveBeenCalled()
    expect(mockLabwareInfoOverlay).toHaveBeenCalled()
    getByText('mock labware render of 300ul Tiprack FIXTURE')
    getByText('mock labware info overlay of 300ul Tiprack FIXTURE')
  })

  it('should render a deck WITH labware and WITH modules', () => {
    when(mockGetLabwareRenderInfo).mockReturnValue({
      [MOCK_300_UL_TIPRACK_ID]: {
        labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
        displayName: 'fresh tips',
        x: MOCK_300_UL_TIPRACK_COORDS[0],
        y: MOCK_300_UL_TIPRACK_COORDS[1],
        z: MOCK_300_UL_TIPRACK_COORDS[2],
        slotName: '1',
      },
    })

    when(mockGetAttachedProtocolModuleMatches).mockReturnValue([
      {
        moduleId: mockMagneticModule.moduleId,
        x: MOCK_MAGNETIC_MODULE_COORDS[0],
        y: MOCK_MAGNETIC_MODULE_COORDS[1],
        z: MOCK_MAGNETIC_MODULE_COORDS[2],
        moduleDef: mockMagneticModule as any,
        nestedLabwareDef: null,
        nestedLabwareId: null,
        protocolLoadOrder: 0,
        attachedModuleMatch: null,
        slotName: '4',
      } as any,
      {
        moduleId: mockTCModule.moduleId,
        x: MOCK_TC_COORDS[0],
        y: MOCK_TC_COORDS[1],
        z: MOCK_TC_COORDS[2],
        moduleDef: mockTCModule,
        nestedLabwareDef: null,
        nestedLabwareId: null,
        protocolLoadOrder: 1,
        attachedModuleMatch: null,
        slotName: '5',
      },
    ])

    when(mockGetModuleDef2)
      .calledWith(mockMagneticModule.model)
      .mockReturnValue(mockMagneticModule as any)
    when(mockGetModuleDef2)
      .calledWith(mockTCModule.model)
      .mockReturnValue(mockTCModule as any)

    when(mockModule)
      .calledWith(
        partialComponentPropsMatcher({
          def: mockMagneticModule,
        })
      )
      .mockReturnValue(<div>mock module viz {mockMagneticModule.type} </div>)

    when(mockModule)
      .calledWith(
        partialComponentPropsMatcher({
          def: mockTCModule,
        })
      )
      .mockReturnValue(<div>mock module viz {mockTCModule.type} </div>)

    const { getByText } = render({
      runId: RUN_ID,
      protocolAnalysis: ({
        commands: [],
        labware: [],
        robotType: OT2_ROBOT_TYPE,
      } as unknown) as CompletedProtocolAnalysis,
    })

    getByText('mock module viz magneticModuleType')
    getByText('mock module viz thermocyclerModuleType')
    getByText('mock labware render of 300ul Tiprack FIXTURE')
    getByText('mock labware info overlay of 300ul Tiprack FIXTURE')
  })
})
