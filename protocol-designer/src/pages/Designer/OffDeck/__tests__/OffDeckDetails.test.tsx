import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'

import { fixture12Trough, FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import { selectors } from '/protocol-designer/labware-ingred/selectors'
import { START_TERMINAL_ITEM_ID } from '/protocol-designer/steplist'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getAllWellContentsForActiveItem } from '/protocol-designer/top-selectors/well-contents'
import {
  getHoveredDropdownItem,
  getSelectedDropdownItem,
} from '/protocol-designer/ui/steps/selectors'

import { HighlightOffDeckSlot } from '../HighlightOffDeckSlot'
import { OffDeckDetails } from '../OffDeckDetails'

import type { ComponentProps } from 'react'
import type * as Components from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('/protocol-designer/ui/steps/selectors')
vi.mock('../HighlightOffDeckSlot')
vi.mock('/protocol-designer/top-selectors/labware-locations')
vi.mock('/protocol-designer/file-data/selectors')
vi.mock('/protocol-designer/labware-ingred/selectors')
vi.mock('/protocol-designer/top-selectors/well-contents')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof Components>()
  return {
    ...actual,
    LabwareRender: () => <div>mock LabwareRender</div>,
  }
})

const render = (props: ComponentProps<typeof OffDeckDetails>) => {
  return renderWithProviders(<OffDeckDetails {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('OffDeckDetails', () => {
  let props: ComponentProps<typeof OffDeckDetails>

  beforeEach(() => {
    props = {
      terminalItemId: START_TERMINAL_ITEM_ID,
      addLabware: vi.fn(),
    }
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      modules: {},
      additionalEquipmentOnDeck: {},
      pipettes: {},
      labware: {
        labware: {
          id: 'mockId',
          def: fixture12Trough as LabwareDefinition2,
          labwareDefURI: 'mockDefUri',
          stack: ['mockId', 'offDeck'],
          pythonName: 'mockPythonName',
        },
      },
    })
    vi.mocked(selectors.getLiquidDisplayColors).mockReturnValue({})
    vi.mocked(getAllWellContentsForActiveItem).mockReturnValue({})
    vi.mocked(HighlightOffDeckSlot).mockReturnValue(
      <div>Highlight OffDeck Slot</div>
    )
    vi.mocked(getSelectedDropdownItem).mockReturnValue([])
    vi.mocked(getHoveredDropdownItem).mockReturnValue({ id: null, text: null })
  })

  it('renders off-deck overview with 1 labware', () => {
    render(props)
    screen.getByText('OFF-DECK LABWARE')
    screen.getByText('mock LabwareRender')
    screen.getByText('Add labware')
    expect(screen.getAllByText('Highlight OffDeck Slot')).toHaveLength(2)
  })
})
