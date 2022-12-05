import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import _uncastedProtocolWithTC from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracksWithTC.json'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { SetupLabwareList } from '../SetupLabwareList'
import { LabwareListItem } from '../LabwareListItem'
import type { ProtocolAnalysisFile } from '@opentrons/shared-data'

jest.mock('../LabwareListItem')

const protocolWithTC = (_uncastedProtocolWithTC as unknown) as ProtocolAnalysisFile

const mockLabwareListItem = LabwareListItem as jest.MockedFunction<
  typeof LabwareListItem
>

const render = () => {
  return renderWithProviders(
    <StaticRouter>
      <SetupLabwareList
        commands={protocolWithTC.commands}
        extraAttentionModules={[]}
        attachedModuleInfo={
          {
            x: 1,
            y: 2,
            z: 3,
            attachedModuleMatch: null,
            moduleId: 'moduleId',
          } as any
        }
      />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('SetupLabwareList', () => {
  beforeEach(() => {
    mockLabwareListItem.mockReturnValue(<div>mock labware list item</div>)
  })

  it('renders the correct headers and labware list items', () => {
    const { getAllByText, getByText } = render()
    getAllByText('mock labware list item')
    getByText('Labware Name')
    getByText('Initial Location')
  })
})
