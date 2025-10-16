import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { ConfirmDeleteEntityInUseModal } from '/protocol-designer/components/organisms/ConfirmDeleteEntityInUseModal'
import { EditNickNameModal } from '/protocol-designer/components/organisms/EditNickNameModal'
import { deleteContainer } from '/protocol-designer/labware-ingred/actions'
import { getIsLabwareOnSlotInUse } from '/protocol-designer/pages/Designer/DeckSetup/utils'
import { getSavedStepForms } from '/protocol-designer/step-forms/selectors'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import { LabwareCardOverflowMenu } from '../index'

import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('/protocol-designer/components/organisms/EditNickNameModal')
vi.mock('/protocol-designer/top-selectors/labware-locations')
vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('/protocol-designer/labware-ingred/actions')
vi.mock('/protocol-designer/pages/Designer/DeckSetup/utils')
vi.mock('/protocol-designer/components/organisms/ConfirmDeleteEntityInUseModal')
const render = (props: ComponentProps<typeof LabwareCardOverflowMenu>) => {
  return renderWithProviders(<LabwareCardOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LabwareCardOverflowMenu', () => {
  let props: ComponentProps<typeof LabwareCardOverflowMenu>

  beforeEach(() => {
    props = {
      setShowOverflowMenu: vi.fn(),
      labwareIds: ['mockLabwareId'],
    }
    vi.mocked(EditNickNameModal).mockReturnValue(
      <div>mock EditNickNameModal</div>
    )
    vi.mocked(getSavedStepForms).mockReturnValue({})
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      labware: {
        mockLabwareId: {
          id: 'mockLabwareId',
          def: fixture96Plate as LabwareDefinition2,
          stack: ['mockLabwareId', 'A1'],
          labwareDefURI: 'mockUri',
          pythonName: 'mockPythonName',
        },
      },
      pipettes: {},
      modules: {},
      additionalEquipmentOnDeck: {},
    })
    vi.mocked(getIsLabwareOnSlotInUse).mockReturnValue(false)
    vi.mocked(ConfirmDeleteEntityInUseModal).mockReturnValue(
      <div>mock ConfirmDeleteEntityInUseModal</div>
    )
  })
  it('renders the overflow menu with 2 buttons', () => {
    render(props)
    fireEvent.click(screen.getByText('Rename labware'))
    screen.getByText('mock EditNickNameModal')
    fireEvent.click(screen.getByText('Delete labware'))
    expect(vi.mocked(deleteContainer)).toHaveBeenCalledTimes(1)
  })
  it('renders the labware in use modal when trying to delete', () => {
    vi.mocked(getIsLabwareOnSlotInUse).mockReturnValue(true)
    render(props)
    fireEvent.click(screen.getByText('Delete labware'))
    screen.getByText('mock ConfirmDeleteEntityInUseModal')
  })
})
