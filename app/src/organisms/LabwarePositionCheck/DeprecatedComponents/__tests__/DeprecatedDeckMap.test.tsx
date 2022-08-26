import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  LabwareRender,
  Module,
  RobotWorkSpace,
  componentPropsMatcher,
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'
import {
  inferModuleOrientationFromXCoordinate,
  LabwareDefinition2,
  ModuleModel,
  ModuleType,
} from '@opentrons/shared-data'
import { mockMagneticModule as mockMagneticModuleFixture } from '@opentrons/app/src/redux/modules/__fixtures__'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import {
  useLabwareRenderInfoForRunById,
  useModuleRenderInfoForProtocolById,
} from '../../../Devices/hooks'
import { useCurrentRunId } from '../../../ProtocolUpload/hooks'
import { DeprecatedDeckMap } from '../DeprecatedDeckMap'

import type { HostConfig } from '@opentrons/api-client'

jest.mock('../../../Devices/hooks')
jest.mock('../../../ProtocolUpload/hooks')
jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    Module: jest.fn(() => <div>mock Module</div>),
    RobotWorkSpace: jest.fn(() => <div>mock RobotWorkSpace</div>),
    LabwareRender: jest.fn(() => <div>mock LabwareRender</div>),
  }
})
jest.mock('@opentrons/react-api-client')
jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    inferModuleOrientationFromXCoordinate: jest.fn(),
  }
})

const STUBBED_ORIENTATION_VALUE = 'left'
const MOCK_MAGNETIC_MODULE_COORDS = [10, 20, 0]
const MOCK_300_UL_TIPRACK_COORDS = [30, 40, 0]
const mockMagneticModule = {
  labwareOffset: { x: 5, y: 5, z: 5 },
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleType,
}
const LABWARE_ID_TO_HIGHLIGHT = 'LABWARE_ID_TO_HIGHLIGHT'
const ANOTHER_LABWARE_ID_TO_HIGHLIGHT = 'ANOTHER_LABWARE_ID_TO_HIGHLIGHT'
const MOCK_ROBOT_NAME = 'otie'
const MOCK_RUN_ID = '1'
const HOST_CONFIG: HostConfig = {
  hostname: 'localhost',
  robotName: MOCK_ROBOT_NAME,
}

const mockModule = Module as jest.MockedFunction<typeof Module>
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
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const mockInferModuleOrientationFromXCoordinate = inferModuleOrientationFromXCoordinate as jest.MockedFunction<
  typeof inferModuleOrientationFromXCoordinate
>

const render = (
  props: Partial<React.ComponentProps<typeof DeprecatedDeckMap>> = {}
) => {
  return renderWithProviders(<DeprecatedDeckMap {...props} />)[0]
}

describe('LPC DeprecatedDeckMap', () => {
  beforeEach(() => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockUseCurrentRunId).calledWith().mockReturnValue(MOCK_RUN_ID)
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
          {children()}
        </svg>
      ))

    when(mockLabwareRender)
      .mockReturnValue(<div></div>)
      .calledWith(
        componentPropsMatcher({
          definition: fixture_tiprack_300_ul,
        })
      )
      .mockReturnValue(
        <div>
          mock labware render of {fixture_tiprack_300_ul.metadata.displayName}
        </div>
      )

    when(mockModule)
      .calledWith(
        partialComponentPropsMatcher({
          def: mockMagneticModule,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
        })
      )
      .mockImplementation(({ children }) => (
        <div>mock module with children {children}</div>
      ))

    when(mockInferModuleOrientationFromXCoordinate)
      .calledWith(expect.anything())
      .mockReturnValue(STUBBED_ORIENTATION_VALUE)

    when(mockUseLabwareRenderInfoForRunById)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({
        [LABWARE_ID_TO_HIGHLIGHT]: {
          labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
          displayName: 'dirty tips',
          x: MOCK_300_UL_TIPRACK_COORDS[0],
          y: MOCK_300_UL_TIPRACK_COORDS[1],
          z: MOCK_300_UL_TIPRACK_COORDS[2],
        },
      })

    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({
        [mockMagneticModule.moduleId]: {
          moduleId: mockMagneticModule.moduleId,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
          nestedLabwareId: ANOTHER_LABWARE_ID_TO_HIGHLIGHT,
          nestedLabwareDisplayName: 'fresh tips',
          protocolLoadOrder: 1,
          attachedModuleMatch: {
            ...mockMagneticModuleFixture,
            model: mockMagneticModule.model,
          } as any,
          slotName: '1',
        },
      })
  })
  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should render a deckmap with labware highlighted', () => {
    const { getByTestId } = render({
      labwareIdsToHighlight: [
        LABWARE_ID_TO_HIGHLIGHT,
        ANOTHER_LABWARE_ID_TO_HIGHLIGHT,
      ],
    })
    getByTestId(`DeckMap_${LABWARE_ID_TO_HIGHLIGHT}_highlight`)
    getByTestId(`DeckMap_module_${ANOTHER_LABWARE_ID_TO_HIGHLIGHT}_highlight`)
  })
  it('should render a deckmap with a blank circle and checkbox over completed non module sections', () => {
    const { getByTestId } = render({
      labwareIdsToHighlight: [ANOTHER_LABWARE_ID_TO_HIGHLIGHT],
      completedLabwareIds: [LABWARE_ID_TO_HIGHLIGHT],
    })
    getByTestId(`DeckMap_${LABWARE_ID_TO_HIGHLIGHT}_checkmark`)
    getByTestId(`DeckMap_module_${ANOTHER_LABWARE_ID_TO_HIGHLIGHT}_highlight`)
  })
  it('should render a deckmap with a blank circle and checkbox over completed module section', () => {
    const { getByTestId } = render({
      labwareIdsToHighlight: [LABWARE_ID_TO_HIGHLIGHT],
      completedLabwareIds: [ANOTHER_LABWARE_ID_TO_HIGHLIGHT],
    })
    getByTestId(`DeckMap_${LABWARE_ID_TO_HIGHLIGHT}_highlight`)
    getByTestId(`DeckMap_module_${ANOTHER_LABWARE_ID_TO_HIGHLIGHT}_checkmark`)
  })
})
