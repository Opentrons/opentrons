import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  getRobotTypeFromLoadedLabware,
  getDeckDefFromRobotType,
  OT2_ROBOT_TYPE,
  FLEX_ROBOT_TYPE,
} from '@opentrons/shared-data'
import ot2StandardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import {
  BaseDeck,
  EXTENDED_DECK_CONFIG_FIXTURE,
  renderWithProviders,
} from '@opentrons/components'
import { simpleAnalysisFileFixture } from '@opentrons/api-client'

import { i18n } from '../../../i18n'
import { useAttachedModules } from '../../../organisms/Devices/hooks'
import { getStandardDeckViewLayerBlockList } from '../utils/getStandardDeckViewLayerBlockList'
import { mockProtocolModuleInfo } from '../../../organisms/ProtocolSetupLabware/__fixtures__'
import { DeckThumbnail } from '../'

import type {
  LabwareDefinition2,
  LoadedLabware,
  ModuleModel,
  RunTimeCommand,
} from '@opentrons/shared-data'

jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    getRobotTypeFromLoadedLabware: jest.fn(),
    getDeckDefFromRobotType: jest.fn(),
  }
})
jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    Module: jest.fn(({ def, x, y, children }) => (
      <div>
        mock Module ({x},{y}) {def.model} {children}
      </div>
    )),
    LabwareRender: jest.fn(({ definition }) => (
      <div>mock LabwareRender {definition.parameters.loadName}</div>
    )),
  }
})

jest.mock('@opentrons/components/src/hardware-sim/BaseDeck')
jest.mock('../../../redux/config')
jest.mock('../../../organisms/Devices/hooks')

const mockgetRobotTypeFromLoadedLabware = getRobotTypeFromLoadedLabware as jest.MockedFunction<
  typeof getRobotTypeFromLoadedLabware
>

const mockgetDeckDefFromRobotType = getDeckDefFromRobotType as jest.MockedFunction<
  typeof getDeckDefFromRobotType
>
const mockBaseDeck = BaseDeck as jest.MockedFunction<typeof BaseDeck>

const protocolAnalysis = simpleAnalysisFileFixture as any
const commands: RunTimeCommand[] = simpleAnalysisFileFixture.commands as any
const labware: LoadedLabware[] = simpleAnalysisFileFixture.labware as any

const render = (props: React.ComponentProps<typeof DeckThumbnail>) => {
  return renderWithProviders(<DeckThumbnail {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DeckThumbnail', () => {
  beforeEach(() => {
    when(mockgetRobotTypeFromLoadedLabware)
      .calledWith(labware)
      .mockReturnValue('OT-2 Standard')
    when(mockgetDeckDefFromRobotType)
      .calledWith('OT-2 Standard')
      .mockReturnValue(ot2StandardDeckDef as any)
    when(mockBaseDeck)
      .calledWith({
        robotType: OT2_ROBOT_TYPE,
        deckLayerBlocklist: getStandardDeckViewLayerBlockList(OT2_ROBOT_TYPE),
        deckConfig: EXTENDED_DECK_CONFIG_FIXTURE,
        labwareLocations: [],
        moduleLocations: [],
      })
      .mockReturnValue(<div>mock BaseDeck</div>)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders an OT-2 deck view when the protocol is an OT-2 protocol', () => {
    when(mockgetRobotTypeFromLoadedLabware)
      .calledWith(labware)
      .mockReturnValue('OT-2 Standard')
    const { getByText } = render({ protocolAnalysis, commands, labware })
    expect(mockgetDeckDefFromRobotType).toHaveBeenCalledWith('OT-2 Standard')
    getByText('mock BaseDeck')
  })
  it('renders an OT-3 deck view when the protocol is an OT-3 protocol', () => {
    const mockLabwareLocations = [
      {
        labwareLocation: { slotName: 'C1' },
        definition: fixture_tiprack_300_ul as LabwareDefinition2,
        topLabwareId: '300_ul_tiprack_id',
        onLabwareClick: expect.any(Function),
        labwareChildren: null,
      },
    ]
    const mockModuleLocations = [
      {
        moduleModel: 'heaterShakerModuleV1' as ModuleModel,
        moduleLocation: { slotName: 'B1' },
        nestedLabwareDef: mockProtocolModuleInfo[0]
          .nestedLabwareDef as LabwareDefinition2,
        onLabwareClick: expect.any(Function),
        moduleChildren: null,
        innerProps: {},
      },
    ]
    when(mockBaseDeck)
      .calledWith({
        robotType: FLEX_ROBOT_TYPE,
        deckLayerBlocklist: getStandardDeckViewLayerBlockList(FLEX_ROBOT_TYPE),
        deckConfig: EXTENDED_DECK_CONFIG_FIXTURE,
        labwareLocations: mockLabwareLocations,
        moduleLocations: mockModuleLocations,
      })
      .mockReturnValue(<div>mock BaseDeck</div>)
    when(mockgetRobotTypeFromLoadedLabware)
      .calledWith(labware)
      .mockReturnValue('OT-3 Standard')
    render({ protocolAnalysis, commands, labware })
    expect(mockgetDeckDefFromRobotType).toHaveBeenCalledWith('OT-3 Standard')
  })
})
