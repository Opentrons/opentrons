import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { simpleAnalysisFileFixture } from '@opentrons/api-client'
import { i18n } from '../../../i18n'
import { DeckThumbnail } from '../'
import { LoadedLabware, RunTimeCommand } from '@opentrons/shared-data'

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

const commands: RunTimeCommand[] = simpleAnalysisFileFixture.commands as any
const labware: LoadedLabware[] = simpleAnalysisFileFixture.labware as any

const render = (props: React.ComponentProps<typeof DeckThumbnail>) => {
  return renderWithProviders(<DeckThumbnail {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DeckThumbnail', () => {
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
  it('renders an ot-2 deckmap when the protocol is an ot-2 protocol', () => {})
})
