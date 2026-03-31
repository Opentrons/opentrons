import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate, fixtureLid } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { ConfirmDeleteEntityInUseModal } from '/protocol-designer/components/organisms/ConfirmDeleteEntityInUseModal'
import { EditNickNameModal } from '/protocol-designer/components/organisms/EditNickNameModal'
import { deleteContainer } from '/protocol-designer/labware-ingred/actions'
import { selectors } from '/protocol-designer/labware-ingred/selectors'
import { getIsLabwareOnSlotInUse } from '/protocol-designer/pages/Designer/DeckSetup/utils'
import { getSavedStepForms } from '/protocol-designer/step-forms/selectors'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import { LabwareCardOverflowMenu } from '../index'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { ZoomedIntoSlotInfoState } from '/protocol-designer/labware-ingred/types'

const mockNavigate = vi.fn()

vi.mock('/protocol-designer/components/organisms/EditNickNameModal')
vi.mock('/protocol-designer/top-selectors/labware-locations')
vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('/protocol-designer/labware-ingred/actions')
vi.mock('/protocol-designer/labware-ingred/selectors')
vi.mock('/protocol-designer/pages/Designer/DeckSetup/utils')
vi.mock('/protocol-designer/components/organisms/ConfirmDeleteEntityInUseModal')
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

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
      labwareIds: ['labId3'],
    }
    vi.mocked(EditNickNameModal).mockReturnValue(
      <div>mock EditNickNameModal</div>
    )
    vi.mocked(getSavedStepForms).mockReturnValue({})
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      labware: {
        labId3: {
          stack: ['labId3', 'D2'],
          id: 'labId3',
          labwareDefURI: 'mockUri',
          def: fixture96Plate as LabwareDefinition2,
          pythonName: 'mockPythonName',
        },
        lid1: {
          stack: ['lid1', 'labId3', 'D2'],
          id: 'lid1',
          labwareDefURI: 'mockUri',
          def: fixtureLid as LabwareDefinition2,
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
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedSlot: { slot: null, cutout: null },
    } as ZoomedIntoSlotInfoState)
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

  it('nicknames the labware, not the lid', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Rename labware' }))
    expect(EditNickNameModal).toHaveBeenCalledWith(
      expect.objectContaining({
        labwareId: 'labId3',
      }),
      {}
    )
  })
})
