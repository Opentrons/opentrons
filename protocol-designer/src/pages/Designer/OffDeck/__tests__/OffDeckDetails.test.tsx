import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'

import { fixture12Trough, FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { getRobotType } from '../../../../file-data/selectors'
import { selectors } from '../../../../labware-ingred/selectors'
import { START_TERMINAL_ITEM_ID } from '../../../../steplist'
import { getDeckSetupForActiveItem } from '../../../../top-selectors/labware-locations'
import { getAllWellContentsForActiveItem } from '../../../../top-selectors/well-contents'
import {
  getHoveredDropdownItem,
  getSelectedDropdownItem,
} from '../../../../ui/steps/selectors'
import { HighlightOffdeckSlot } from '../HighlightOffdeckSlot'
import { OffDeckDetails } from '../OffDeckDetails'

import type { ComponentProps } from 'react'
import type * as Components from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../../../../ui/steps/selectors')
vi.mock('../HighlightOffdeckSlot')
vi.mock('../../../../top-selectors/labware-locations')
vi.mock('../../../../file-data/selectors')
vi.mock('../../../../labware-ingred/selectors')
vi.mock('../../../../top-selectors/well-contents')
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
    vi.mocked(selectors.getLiquidDisplayColors).mockReturnValue([])
    vi.mocked(getAllWellContentsForActiveItem).mockReturnValue({})
    vi.mocked(HighlightOffdeckSlot).mockReturnValue(
      <div>Highlight Offdeck Slot</div>
    )
    vi.mocked(getSelectedDropdownItem).mockReturnValue([])
    vi.mocked(getHoveredDropdownItem).mockReturnValue({ id: null, text: null })
  })

  it('renders off-deck overview with 1 labware', () => {
    render(props)
    screen.getByText('OFF-DECK LABWARE')
    screen.getByText('mock LabwareRender')
    screen.getByText('Add labware')
    expect(screen.getAllByText('Highlight Offdeck Slot')).toHaveLength(2)
  })
})
