import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import {
  getStackedItemsOnStartingDeck,
  multiple_tipacks_with_tc,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { LabwareListItem } from '../LabwareListItem'
import { SetupLabwareList } from '../SetupLabwareList'

import type { ComponentProps } from 'react'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

vi.mock('../LabwareListItem')
vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<typeof getStackedItemsOnStartingDeck>()
  return {
    ...actual,
    getStackedItemsOnStartingDeck: vi.fn(),
  }
})
const protocolWithTC =
  multiple_tipacks_with_tc as unknown as CompletedProtocolAnalysis

const render = (props: ComponentProps<typeof SetupLabwareList>) => {
  return renderWithProviders(
    <MemoryRouter>
      <SetupLabwareList {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('SetupLabwareList', () => {
  beforeEach(() => {
    vi.mocked(LabwareListItem).mockReturnValue(
      <div>mock labware list item</div>
    )
    vi.mocked(getStackedItemsOnStartingDeck).mockReturnValue({
      '9': [
        [
          {
            labwareId: '7',
            displayName: 'mockNickName',
            definitionUri: 'mockDefUri',
          },
        ],
      ],
    })
  })
  it('renders the correct headers and labware list items', () => {
    render({
      protocolAnalysis: {
        ...protocolWithTC,
        modules: [
          {
            id: '18f0c1b0-0122-11ec-88a3-f1745cf9b36c:thermocyclerModuleType',
            model: 'thermocyclerModuleV1',
            location: { slotName: 'B1' },
            serialNumber:
              'fake-serial-number-900e1611-9723-44f6-b637-f5e8422438ae',
          },
        ],
      },
      extraAttentionModules: [],
      attachedModuleInfo: {
        x: 1,
        y: 2,
        z: 3,
        attachedModuleMatch: null,
        moduleId: 'moduleId',
      } as any,
      isFlex: false,
    })

    screen.getAllByText('mock labware list item')
    screen.getByText('Labware name')
    screen.getByText('Location')
  })
})
