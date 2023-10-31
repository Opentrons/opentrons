import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { i18n } from '../../../../../i18n'
import {
  renderWithProviders,
  partialComponentPropsMatcher,
  RobotWorkSpace,
  LabwareRender,
  Module,
} from '@opentrons/components'
import {
  inferModuleOrientationFromXCoordinate,
  LabwareDefinition2,
  ModuleModel,
  ModuleType,
} from '@opentrons/shared-data'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import {
  useLabwareRenderInfoForRunById,
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
} from '../../../hooks'
import { getWellFillFromLabwareId } from '../utils'
import { SetupLiquidsMap } from '../SetupLiquidsMap'
import { LabwareInfoOverlay } from '../../LabwareInfoOverlay'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    Module: jest.fn(() => <div>mock Module</div>),
    RobotWorkSpace: jest.fn(() => <div>mock RobotWorkSpace</div>),
    LabwareRender: jest.fn(() => <div>mock LabwareRender</div>),
  }
})
jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    inferModuleOrientationFromXCoordinate: jest.fn(),
  }
})
jest.mock('../../LabwareInfoOverlay')
jest.mock('../../../hooks')
jest.mock('../utils')

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockLabwareInfoOverlay = LabwareInfoOverlay as jest.MockedFunction<
  typeof LabwareInfoOverlay
>
const mockModule = Module as jest.MockedFunction<typeof Module>
const mockInferModuleOrientationFromXCoordinate = inferModuleOrientationFromXCoordinate as jest.MockedFunction<
  typeof inferModuleOrientationFromXCoordinate
>
const mockRobotWorkSpace = RobotWorkSpace as jest.MockedFunction<
  typeof RobotWorkSpace
>
const mockLabwareRender = LabwareRender as jest.MockedFunction<
  typeof LabwareRender
>
const mockUseLabwareRenderInfoForRunById = useLabwareRenderInfoForRunById as jest.MockedFunction<
  typeof useLabwareRenderInfoForRunById
>
const mockUseModuleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById as jest.MockedFunction<
  typeof useModuleRenderInfoForProtocolById
>
const mockGetWellFillFromLabwareId = getWellFillFromLabwareId as jest.MockedFunction<
  typeof getWellFillFromLabwareId
>

const MOCK_WELL_FILL = { C1: '#ff4888', C2: '#ff4888' }

const deckSlotsById = standardDeckDef.locations.orderedSlots.reduce(
  (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
  {}
)

const ROBOT_NAME = 'otie'
const RUN_ID = '1'
const STUBBED_ORIENTATION_VALUE = 'left'
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

const render = (props: React.ComponentProps<typeof SetupLiquidsMap>) => {
  return renderWithProviders(<SetupLiquidsMap {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SetupLiquidsMap', () => {
  let props: React.ComponentProps<typeof SetupLiquidsMap>
  beforeEach(() => {
    props = { runId: RUN_ID, robotName: ROBOT_NAME }
    when(mockInferModuleOrientationFromXCoordinate)
      .calledWith(expect.anything())
      .mockReturnValue(STUBBED_ORIENTATION_VALUE)
    when(mockLabwareRender)
      .mockReturnValue(<div></div>) // this (default) empty div will be returned when LabwareRender isn't called with expected labware definition
      .calledWith(
        partialComponentPropsMatcher({
          definition: fixture_tiprack_300_ul,
          wellFill: undefined,
        })
      )
      .mockReturnValue(
        <div>
          mock labware render of {fixture_tiprack_300_ul.metadata.displayName}
        </div>
      )
      .calledWith(
        partialComponentPropsMatcher({
          wellFill: { C1: '#ff4888', C2: '#ff4888' },
        })
      )
      .mockReturnValue(<div>mock labware render with well fill</div>)

    when(mockLabwareInfoOverlay)
      .mockReturnValue(<div></div>) // this (default) empty div will be returned when LabwareInfoOverlay isn't called with expected props
      .calledWith(
        partialComponentPropsMatcher({
          definition: fixture_tiprack_300_ul,
          labwareHasLiquid: false,
        })
      )
      .mockReturnValue(
        <div>
          mock labware info overlay of{' '}
          {fixture_tiprack_300_ul.metadata.displayName}
        </div>
      )
      .calledWith(partialComponentPropsMatcher({ labwareHasLiquid: true }))
      .mockReturnValue(<div>mock labware overlay with liquid</div>)

    when(mockRobotWorkSpace)
      .mockReturnValue(<div></div>) // this (default) empty div will be returned when RobotWorkSpace isn't called with expected props
      .calledWith(
        partialComponentPropsMatcher({
          deckDef: standardDeckDef,
          children: expect.anything(),
        })
      )
      .mockImplementation(({ children }) => (
        <svg>
          {/* @ts-expect-error children won't be null since we checked for expect.anything() above */}
          {children({
            deckSlotsById,
            getRobotCoordsFromDOMCoords: {} as any,
          })}
        </svg>
      ))
    when(mockUseProtocolDetailsForRun)
      .calledWith(RUN_ID)
      .mockReturnValue({
        protocolData: {
          pipettes: {},
          labware: {},
          modules: {
            heatershaker_id: {
              model: 'heaterShakerModuleV1',
            },
          },
          liquids: [
            {
              id: '1',
              displayName: 'mock liquid',
              description: '',
              displayColor: '#FFFFFF',
            },
          ],
          labwareDefinitions: {},
          commands: [],
        },
      } as any)
  })
  afterEach(() => resetAllWhenMocks())

  it('should render a deck WITHOUT labware and WITHOUT modules', () => {
    when(mockUseLabwareRenderInfoForRunById)
      .calledWith(RUN_ID)
      .mockReturnValue({})
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({})

    render(props)
    expect(mockModule).not.toHaveBeenCalled()
    expect(mockLabwareRender).not.toHaveBeenCalled()
    expect(mockLabwareInfoOverlay).not.toHaveBeenCalled()
  })
  it('should render a deck WITH labware and WITHOUT modules', () => {
    when(mockUseLabwareRenderInfoForRunById)
      .calledWith(RUN_ID)
      .mockReturnValue({
        '300_ul_tiprack_id': {
          labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
          displayName: 'fresh tips',
          x: MOCK_300_UL_TIPRACK_COORDS[0],
          y: MOCK_300_UL_TIPRACK_COORDS[1],
          z: MOCK_300_UL_TIPRACK_COORDS[2],
          slotName: '1',
        },
      })

    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({})

    const [{ getByText }] = render(props)
    expect(mockModule).not.toHaveBeenCalled()
    expect(mockLabwareRender).toHaveBeenCalled()
    expect(mockLabwareInfoOverlay).toHaveBeenCalled()
    getByText('mock labware render of 300ul Tiprack FIXTURE')
    getByText('mock labware info overlay of 300ul Tiprack FIXTURE')
  })

  it('should render a deck WITH labware and WITH modules', () => {
    when(mockUseLabwareRenderInfoForRunById)
      .calledWith(RUN_ID)
      .mockReturnValue({
        [MOCK_300_UL_TIPRACK_ID]: {
          labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
          displayName: 'fresh tips',
          x: MOCK_300_UL_TIPRACK_COORDS[0],
          y: MOCK_300_UL_TIPRACK_COORDS[1],
          z: MOCK_300_UL_TIPRACK_COORDS[2],
          slotName: '1',
        },
      })

    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        [mockMagneticModule.moduleId]: {
          moduleId: mockMagneticModule.moduleId,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          protocolLoadOrder: 0,
          attachedModuleMatch: null,
        },
        [mockTCModule.moduleId]: {
          moduleId: mockTCModule.moduleId,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
          z: MOCK_TC_COORDS[2],
          moduleDef: mockTCModule,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          protocolLoadOrder: 1,
          attachedModuleMatch: null,
        },
      } as any)

    when(mockModule)
      .calledWith(
        partialComponentPropsMatcher({
          def: mockMagneticModule,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
        })
      )
      .mockReturnValue(<div>mock module viz {mockMagneticModule.type} </div>)

    when(mockModule)
      .calledWith(
        partialComponentPropsMatcher({
          def: mockTCModule,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
        })
      )
      .mockReturnValue(<div>mock module viz {mockTCModule.type} </div>)

    const [{ getByText }] = render(props)
    getByText('mock module viz magneticModuleType')
    getByText('mock module viz thermocyclerModuleType')
    getByText('mock labware render of 300ul Tiprack FIXTURE')
    getByText('mock labware info overlay of 300ul Tiprack FIXTURE')
  })
  it('should render labware overlay and labware render with liquids', () => {
    when(mockUseLabwareRenderInfoForRunById)
      .calledWith(RUN_ID)
      .mockReturnValue({
        '300_ul_tiprack_id': {
          labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
          displayName: 'fresh tips',
          x: MOCK_300_UL_TIPRACK_COORDS[0],
          y: MOCK_300_UL_TIPRACK_COORDS[1],
          z: MOCK_300_UL_TIPRACK_COORDS[2],
          slotName: '1',
        },
      })
    mockGetWellFillFromLabwareId.mockReturnValue(MOCK_WELL_FILL)
    const [{ getByText }] = render({ ...props })
    getByText('mock labware overlay with liquid')
    getByText('mock labware render with well fill')
  })
})
