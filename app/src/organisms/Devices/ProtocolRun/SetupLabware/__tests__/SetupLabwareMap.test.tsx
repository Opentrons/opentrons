import * as React from 'react'
import { when } from 'vitest-when'
import { StaticRouter } from 'react-router-dom'
import { describe, it, beforeEach, vi, afterEach, expect } from 'vitest'
import { screen } from '@testing-library/react'

import { LabwareRender, Module } from '@opentrons/components'
import { OT2_ROBOT_TYPE, getModuleDef2 } from '@opentrons/shared-data'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'

import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '../../../../../__testing-utils__'
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

vi.mock('@opentrons/components/src/hardware-sim/Labware/LabwareRender')
vi.mock('@opentrons/components/src/hardware-sim/Module')
vi.mock('@opentrons/shared-data', () => {
  const actualSharedData = vi.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    getModuleDef2: vi.fn(),
  }
})
vi.mock('../../../../ProtocolSetupModulesAndDeck/utils')
vi.mock('../../LabwareInfoOverlay')
vi.mock('../../utils/getLabwareRenderInfo')
vi.mock('../../utils/getModuleTypesThatRequireExtraAttention')
vi.mock('../../../../RunTimeControl/hooks')
vi.mock('../../../hooks')

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
    when(vi.mocked(getAttachedProtocolModuleMatches)).thenReturn([])
    when(vi.mocked(getLabwareRenderInfo)).thenReturn({})
    when(vi.mocked(LabwareRender))
      .thenReturn(<div></div>) // this (default) empty div will be returned when LabwareRender isn't called with expected labware definition
      .calledWith(
        partialComponentPropsMatcher({
          definition: fixture_tiprack_300_ul,
        })
      )
      .thenReturn(
        <div>
          mock labware render of {fixture_tiprack_300_ul.metadata.displayName}
        </div>
      )

    when(vi.mocked(LabwareInfoOverlay))
      .thenReturn(<div></div>) // this (default) empty div will be returned when LabwareInfoOverlay isn't called with expected props
      .calledWith(
        partialComponentPropsMatcher({ definition: fixture_tiprack_300_ul })
      )
      .thenReturn(
        <div>
          mock labware info overlay of{' '}
          {fixture_tiprack_300_ul.metadata.displayName}
        </div>
      )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render a deck WITHOUT labware and WITHOUT modules', () => {
    expect(vi.mocked(Module)).not.toHaveBeenCalled()
    expect(vi.mocked(LabwareRender)).not.toHaveBeenCalled()
    expect(vi.mocked(LabwareInfoOverlay)).not.toHaveBeenCalled()
  })
  it('should render a deck WITH labware and WITHOUT modules', () => {
    when(vi.mocked(getLabwareRenderInfo)).thenReturn({
      '300_ul_tiprack_id': {
        labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
        displayName: 'fresh tips',
        x: MOCK_300_UL_TIPRACK_COORDS[0],
        y: MOCK_300_UL_TIPRACK_COORDS[1],
        z: MOCK_300_UL_TIPRACK_COORDS[2],
        slotName: '1',
      },
    })

    render({
      runId: RUN_ID,
      protocolAnalysis: ({
        commands: [],
        labware: [],
        robotType: OT2_ROBOT_TYPE,
      } as unknown) as CompletedProtocolAnalysis,
    })

    expect(vi.mocked(Module)).not.toHaveBeenCalled()
    expect(vi.mocked(LabwareRender)).toHaveBeenCalled()
    expect(vi.mocked(LabwareInfoOverlay)).toHaveBeenCalled()
    screen.getByText('mock labware render of 300ul Tiprack FIXTURE')
    screen.getByText('mock labware info overlay of 300ul Tiprack FIXTURE')
  })

  it('should render a deck WITH labware and WITH modules', () => {
    when(vi.mocked(getLabwareRenderInfo)).thenReturn({
      [MOCK_300_UL_TIPRACK_ID]: {
        labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
        displayName: 'fresh tips',
        x: MOCK_300_UL_TIPRACK_COORDS[0],
        y: MOCK_300_UL_TIPRACK_COORDS[1],
        z: MOCK_300_UL_TIPRACK_COORDS[2],
        slotName: '1',
      },
    })

    when(vi.mocked(getAttachedProtocolModuleMatches)).thenReturn([
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

    when(vi.mocked(getModuleDef2))
      .calledWith(mockMagneticModule.model)
      .thenReturn(mockMagneticModule as any)
    when(vi.mocked(getModuleDef2))
      .calledWith(mockTCModule.model)
      .thenReturn(mockTCModule as any)

    when(vi.mocked(Module))
      .calledWith(
        partialComponentPropsMatcher({
          def: mockMagneticModule,
        })
      )
      .thenReturn(<div>mock module viz {mockMagneticModule.type} </div>)

    when(vi.mocked(Module))
      .calledWith(
        partialComponentPropsMatcher({
          def: mockTCModule,
        })
      )
      .thenReturn(<div>mock module viz {mockTCModule.type} </div>)

    render({
      runId: RUN_ID,
      protocolAnalysis: ({
        commands: [],
        labware: [],
        robotType: OT2_ROBOT_TYPE,
      } as unknown) as CompletedProtocolAnalysis,
    })

    screen.getByText('mock module viz magneticModuleType')
    screen.getByText('mock module viz thermocyclerModuleType')
    screen.getByText('mock labware render of 300ul Tiprack FIXTURE')
    screen.getByText('mock labware info overlay of 300ul Tiprack FIXTURE')
  })
})
