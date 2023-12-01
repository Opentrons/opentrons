import * as React from 'react'
import '@testing-library/jest-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { StaticRouter } from 'react-router-dom'
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import {
  renderWithProviders,
  partialComponentPropsMatcher,
  componentPropsMatcher,
} from '@opentrons/components'

import { i18n } from '../../../../../i18n'
import {
  mockThermocycler as mockThermocyclerFixture,
  mockMagneticModule as mockMagneticModuleFixture,
} from '../../../../../redux/modules/__fixtures__/index'
import { useMostRecentCompletedAnalysis } from '../../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { getAttachedProtocolModuleMatches } from '../../../../ProtocolSetupModulesAndDeck/utils'
import { ModuleInfo } from '../../../ModuleInfo'
import { SetupModulesMap } from '../SetupModulesMap'

import type {
  CompletedProtocolAnalysis,
  ModuleModel,
  ModuleType,
} from '@opentrons/shared-data'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    RobotWorkSpace: jest.fn(() => <div>mock RobotWorkSpace</div>),
  }
})
jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    inferModuleOrientationFromXCoordinate: jest.fn(),
  }
})
jest.mock('../../../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
jest.mock('../../../../ProtocolSetupModulesAndDeck/utils')
jest.mock('../../../ModuleInfo')
jest.mock('../../../hooks')

const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockGetAttachedProtocolModuleMatches = getAttachedProtocolModuleMatches as jest.MockedFunction<
  typeof getAttachedProtocolModuleMatches
>
const mockModuleInfo = ModuleInfo as jest.MockedFunction<typeof ModuleInfo>

const render = (props: React.ComponentProps<typeof SetupModulesMap>) => {
  return renderWithProviders(
    <StaticRouter>
      <SetupModulesMap {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

const MOCK_MAGNETIC_MODULE_COORDS = [10, 20, 0]
const MOCK_SECOND_MAGNETIC_MODULE_COORDS = [100, 200, 0]
const MOCK_TC_COORDS = [20, 30, 0]
const MOCK_RUN_ID = '1'

const mockMagneticModule = {
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleType,
  labwareOffset: { x: 5, y: 5, z: 5 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
}

const mockTCModule = {
  moduleId: 'TCModuleId',
  model: 'thermocyclerModuleV1' as ModuleModel,
  type: 'thermocyclerModuleType' as ModuleType,
  labwareOffset: { x: 3, y: 3, z: 3 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
}

describe('SetupModulesMap', () => {
  let props: React.ComponentProps<typeof SetupModulesMap>
  beforeEach(() => {
    props = {
      runId: MOCK_RUN_ID,
    }
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue(({
        commands: [],
        labware: [],
        robotType: OT2_ROBOT_TYPE,
      } as unknown) as CompletedProtocolAnalysis)
    when(mockGetAttachedProtocolModuleMatches).mockReturnValue([])
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render a deck WITHOUT modules if none passed (component will never be rendered in this circumstance)', () => {
    render(props)
    expect(mockModuleInfo).not.toHaveBeenCalled()
  })
  it('should render a deck WITH MoaM', () => {
    when(mockGetAttachedProtocolModuleMatches).mockReturnValue([
      {
        moduleId: mockMagneticModule.moduleId,
        x: MOCK_MAGNETIC_MODULE_COORDS[0],
        y: MOCK_MAGNETIC_MODULE_COORDS[1],
        z: MOCK_MAGNETIC_MODULE_COORDS[2],
        moduleDef: mockMagneticModule as any,
        nestedLabwareDef: null,
        nestedLabwareDisplayName: null,
        nestedLabwareId: null,
        slotName: '1',
        protocolLoadOrder: 1,
        attachedModuleMatch: null,
      },
      {
        moduleId: mockMagneticModule.moduleId,
        x: MOCK_SECOND_MAGNETIC_MODULE_COORDS[0],
        y: MOCK_SECOND_MAGNETIC_MODULE_COORDS[1],
        z: MOCK_SECOND_MAGNETIC_MODULE_COORDS[2],
        moduleDef: mockMagneticModule as any,
        nestedLabwareDef: null,
        nestedLabwareDisplayName: null,
        nestedLabwareId: null,
        slotName: '2',
        protocolLoadOrder: 0,
        attachedModuleMatch: null,
      },
    ])

    when(mockModuleInfo)
      .calledWith(
        partialComponentPropsMatcher({
          moduleModel: mockMagneticModule.model,
          isAttached: false,
          physicalPort: null,
          runId: MOCK_RUN_ID,
        })
      )
      .mockReturnValue(<div>mock module info {mockMagneticModule.model}</div>)

    const { getAllByText } = render(props)
    expect(getAllByText('mock module info magneticModuleV2')).toHaveLength(2)
  })

  it('should render a deck WITH modules', () => {
    when(mockGetAttachedProtocolModuleMatches).mockReturnValue([
      {
        moduleId: mockMagneticModule.moduleId,
        x: MOCK_MAGNETIC_MODULE_COORDS[0],
        y: MOCK_MAGNETIC_MODULE_COORDS[1],
        z: MOCK_MAGNETIC_MODULE_COORDS[2],
        moduleDef: mockMagneticModule as any,
        nestedLabwareDef: null,
        nestedLabwareDisplayName: null,
        nestedLabwareId: null,
        slotName: '1',
        protocolLoadOrder: 1,
        attachedModuleMatch: {
          ...mockMagneticModuleFixture,
          model: mockMagneticModule.model,
        } as any,
      },
      {
        moduleId: mockTCModule.moduleId,
        x: MOCK_TC_COORDS[0],
        y: MOCK_TC_COORDS[1],
        z: MOCK_TC_COORDS[2],
        moduleDef: mockTCModule as any,
        nestedLabwareDef: null,
        nestedLabwareId: null,
        nestedLabwareDisplayName: null,
        protocolLoadOrder: 0,
        attachedModuleMatch: {
          ...mockThermocyclerFixture,
          model: mockTCModule.model,
        } as any,
        slotName: '7',
      },
    ])

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          moduleModel: mockMagneticModule.model,
          isAttached: true,
          physicalPort: mockMagneticModuleFixture.usbPort,
          runId: MOCK_RUN_ID,
        })
      )
      .mockReturnValue(<div>mock module info {mockMagneticModule.model} </div>)

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          moduleModel: mockTCModule.model,
          isAttached: true,
          physicalPort: mockThermocyclerFixture.usbPort,
          runId: MOCK_RUN_ID,
        })
      )
      .mockReturnValue(<div>mock module info {mockTCModule.model} </div>)

    const { getByText } = render(props)
    getByText('mock module info magneticModuleV2')
    getByText('mock module info thermocyclerModuleV1')
  })

  it('renders Moam with the correct module in the correct slot', () => {
    const dupModId = `${mockMagneticModule.moduleId}duplicate`
    const dupModPort = 10

    when(mockGetAttachedProtocolModuleMatches).mockReturnValue([
      {
        moduleId: mockMagneticModule.moduleId,
        x: MOCK_MAGNETIC_MODULE_COORDS[0],
        y: MOCK_MAGNETIC_MODULE_COORDS[1],
        z: MOCK_MAGNETIC_MODULE_COORDS[2],
        moduleDef: mockMagneticModule as any,
        nestedLabwareDef: null,
        nestedLabwareId: null,
        nestedLabwareDisplayName: null,
        protocolLoadOrder: 1,
        attachedModuleMatch: {
          ...mockMagneticModuleFixture,
          model: mockMagneticModule.model,
        } as any,
        slotName: '1',
      },
      {
        moduleId: dupModId,
        x: MOCK_SECOND_MAGNETIC_MODULE_COORDS[0],
        y: MOCK_SECOND_MAGNETIC_MODULE_COORDS[1],
        z: MOCK_SECOND_MAGNETIC_MODULE_COORDS[2],
        moduleDef: mockMagneticModule as any,
        nestedLabwareDef: null,
        nestedLabwareId: null,
        nestedLabwareDisplayName: null,
        protocolLoadOrder: 0,
        attachedModuleMatch: {
          ...mockMagneticModuleFixture,
          model: mockMagneticModule.model,
          usbPort: {
            port: dupModPort,
            hub: false,
            portGroup: 'unknown',
            path: '',
          },
        } as any,
        slotName: '3',
      },
    ])

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          moduleModel: mockMagneticModule.model,
          isAttached: true,
          physicalPort: mockMagneticModuleFixture.usbPort,
          runId: MOCK_RUN_ID,
        })
      )
      .mockReturnValue(<div>mock module info {mockMagneticModule.model} </div>)

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          moduleModel: mockMagneticModule.model,
          isAttached: true,
          physicalPort: {
            port: dupModPort,
            hub: false,
            portGroup: 'unknown',
            path: '',
          },
          runId: MOCK_RUN_ID,
        })
      )
      .mockReturnValue(<div>mock module info {mockTCModule.model} </div>)

    const { getByText } = render(props)
    getByText('mock module info magneticModuleV2')
  })
})
