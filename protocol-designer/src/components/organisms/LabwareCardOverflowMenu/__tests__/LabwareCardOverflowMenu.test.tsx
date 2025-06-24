import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { deleteContainer } from '../../../../labware-ingred/actions'
import { getIsLabwareOnSlotInUse } from '../../../../pages/Designer/DeckSetup/utils'
import { getSavedStepForms } from '../../../../step-forms/selectors'
import { getDeckSetupForActiveItem } from '../../../../top-selectors/labware-locations'
import { ConfirmDeleteEntityInUseModal } from '../../ConfirmDeleteEntityInUseModal'
import { EditNickNameModal } from '../../EditNickNameModal'
import { LabwareCardOverflowMenu } from '../index'

import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../../EditNickNameModal')
vi.mock('../../../../top-selectors/labware-locations')
vi.mock('../../../../step-forms/selectors')
vi.mock('../../../../labware-ingred/actions')
vi.mock('../../../../pages/Designer/DeckSetup/utils')
vi.mock('../../ConfirmDeleteEntityInUseModal')
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
