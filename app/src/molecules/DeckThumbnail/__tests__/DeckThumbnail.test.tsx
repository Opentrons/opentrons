import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  getRobotTypeFromLoadedLabware,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'
import ot2StandardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import { renderWithProviders } from '@opentrons/components'
import { simpleAnalysisFileFixture } from '@opentrons/api-client'
import { i18n } from '../../../i18n'
import { DeckThumbnail } from '../'
import type { LoadedLabware, RunTimeCommand } from '@opentrons/shared-data'

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
jest.mock('../../../redux/config')

const mockgetRobotTypeFromLoadedLabware = getRobotTypeFromLoadedLabware as jest.MockedFunction<
  typeof getRobotTypeFromLoadedLabware
>

const mockgetDeckDefFromRobotType = getDeckDefFromRobotType as jest.MockedFunction<
  typeof getDeckDefFromRobotType
>

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
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders loaded equipment from protocol analysis file', () => {
    const { queryByText } = render({ commands, labware })
    expect(queryByText('mock Module (0,0) magneticModuleV2')).not.toBeFalsy()
    expect(
      queryByText('mock Module (265,0) temperatureModuleV2')
    ).not.toBeFalsy()
    expect(
      queryByText('mock LabwareRender opentrons_96_tiprack_300ul')
    ).not.toBeFalsy()
    expect(
      queryByText(
        'mock LabwareRender opentrons_24_aluminumblock_generic_2ml_screwcap'
      )
    ).not.toBeFalsy()
    expect(
      queryByText('mock LabwareRender nest_96_wellplate_100ul_pcr_full_skirt')
    ).not.toBeFalsy()
  })
  it('renders an OT-2 deck view when the protocol is an OT-2 protocol', () => {
    when(mockgetRobotTypeFromLoadedLabware)
      .calledWith(labware)
      .mockReturnValue('OT-2 Standard')
    render({ commands, labware })
    expect(mockgetDeckDefFromRobotType).toHaveBeenCalledWith('OT-2 Standard')
  })
  it('renders an OT-3 deck view when the protocol is an OT-3 protocol', () => {
    when(mockgetRobotTypeFromLoadedLabware)
      .calledWith(labware)
      .mockReturnValue('OT-3 Standard')
    render({ commands, labware })
    expect(mockgetDeckDefFromRobotType).toHaveBeenCalledWith('OT-3 Standard')
  })
})
