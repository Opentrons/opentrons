import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { fixture96Plate } from '@opentrons/shared-data'
import { i18n } from '../../../../assets/localization'
import { renderWithProviders } from '../../../../__testing-utils__'
import {
  deleteContainer,
  duplicateLabware,
} from '../../../../labware-ingred/actions'
import { deleteModule } from '../../../../step-forms/actions'
import { deleteDeckFixture } from '../../../../step-forms/actions/additionalItems'
import { getDeckSetupForActiveItem } from '../../../../top-selectors/labware-locations'
import { SlotOverflowMenu } from '../SlotOverflowMenu'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../../../../top-selectors/labware-locations')
vi.mock('../../../../step-forms/actions')
vi.mock('../../../../labware-ingred/actions')
vi.mock('../../../../step-forms/actions/additionalItems')

const render = (props: React.ComponentProps<typeof SlotOverflowMenu>) => {
  return renderWithProviders(<SlotOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('SlotOverflowMenu', () => {
  let props: React.ComponentProps<typeof SlotOverflowMenu>

  beforeEach(() => {
    props = {
      slot: 'D3',
      setShowMenuList: vi.fn(),
      addEquipment: vi.fn(),
    }

    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      labware: {
        labId: {
          slot: 'D3',
          id: 'labId',
          labwareDefURI: 'mockUri',
          def: fixture96Plate as LabwareDefinition2,
        },
        lab2: {
          slot: 'labId',
          id: 'labId2',
          labwareDefURI: 'mockUri',
          def: fixture96Plate as LabwareDefinition2,
        },
      },
      pipettes: {},
      modules: {
        mod: {
          model: 'heaterShakerModuleV1',
          type: 'heaterShakerModuleType',
          id: 'modId',
          slot: 'D3',
          moduleState: {} as any,
        },
      },
      additionalEquipmentOnDeck: {
        fixture: { name: 'stagingArea', id: 'mockId', location: 'cutoutD3' },
      },
    })
  })
  it('should renders all buttons as enabled and clicking on them calls ctas', () => {
    render(props)
    fireEvent.click(
      screen.getByRole('button', { name: 'Add hardware/labware' })
    )
    expect(props.addEquipment).toHaveBeenCalled()
    expect(props.setShowMenuList).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Rename labware' }))
    // TODO(ja, 8/22/24): wire up cta for rename labware modal
    expect(props.setShowMenuList).toHaveBeenCalled()
    // TODO(ja, 8/22/24): wire up cta for liquids
    fireEvent.click(screen.getByRole('button', { name: 'Add liquid' }))
    expect(props.setShowMenuList).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }))
    expect(vi.mocked(duplicateLabware)).toHaveBeenCalled()
    expect(props.setShowMenuList).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Clear slot' }))
    expect(vi.mocked(deleteContainer)).toHaveBeenCalledTimes(2)
    expect(vi.mocked(deleteModule)).toHaveBeenCalled()
    expect(vi.mocked(deleteDeckFixture)).toHaveBeenCalled()
    expect(props.setShowMenuList).toHaveBeenCalled()
  })
  it('should close menu list when overlay is clicked', () => {
    render(props)
    fireEvent.click(screen.getByTestId('SlotOverflowMenu_Overlay'))
    expect(props.setShowMenuList).toHaveBeenCalled()
  })
})
