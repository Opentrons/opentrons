import * as React from 'react'
import { vi, describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { WASTE_CHUTE_CUTOUT } from '@opentrons/shared-data'
import { renderWithProviders } from '../../../__testing-utils__' 
import { i18n } from '../../../localization'
import { getInitialDeckSetup } from '../../../step-forms/selectors'
import { getSlotIsEmpty } from '../../../step-forms'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '../../../step-forms/actions/additionalItems'
import { TrashModal } from '../TrashModal'

vi.mock('../../../step-forms')
vi.mock('../../../step-forms/selectors')
vi.mock('../../../step-forms/actions/additionalItems')

const render = (props: React.ComponentProps<typeof TrashModal>) => {
  return renderWithProviders(<TrashModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TrashModal ', () => {
  let props: React.ComponentProps<typeof TrashModal>
  beforeEach(() => {
    props = {
      onCloseClick: vi.fn(),
      trashName: 'trashBin',
    }
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      additionalEquipmentOnDeck: {},
      labware: {},
      modules: {},
    })
    vi.mocked(getSlotIsEmpty).mockReturnValue(true)
  })
  it('renders buttons, position and slot dropdown', async () => {
    render(props)
    screen.getByText('Trash Bin')
    screen.getByText('Position')
    screen.getByText('Slot A1')
    screen.getByText('Slot A3')
    screen.getByText('Slot B1')
    screen.getByText('Slot B3')
    screen.getByText('Slot C1')
    screen.getByText('Slot C3')
    screen.getByText('Slot D1')
    screen.getByText('Slot D3')
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
    expect(props.onCloseClick).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'save' }))
    await waitFor(() => {
      expect(vi.mocked(createDeckFixture)).toHaveBeenCalledWith('trashBin', 'cutoutA3')
    })
  })
  it('call delete then create container when trash is already on the slot', async () => {
    const mockId = 'mockTrashId'
    props = {
      ...props,
      trashBinId: mockId,
    }
    render(props)
    screen.getByText('Trash Bin')
    fireEvent.click(screen.getByRole('button', { name: 'save' }))
    await waitFor(() => {
      expect(vi.mocked(deleteDeckFixture)).toHaveBeenCalledWith(mockId)
    })
    await waitFor(() => {
      expect(vi.mocked(createDeckFixture)).toHaveBeenCalledWith('trashBin', 'cutoutA3')
    })
  })
  it('renders the button as disabled when the slot is full for trash bin', () => {
    vi.mocked(getSlotIsEmpty).mockReturnValue(false)
    render(props)
    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled()
  })
  it('renders buttons for waste chute', async () => {
    props = {
      ...props,
      trashName: 'wasteChute',
    }
    render(props)
    screen.getByText('Waste Chute')
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
    expect(props.onCloseClick).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'save' }))
    await waitFor(() => {
      expect(vi.mocked(createDeckFixture)).toHaveBeenCalledWith(
        'wasteChute',
        WASTE_CHUTE_CUTOUT
      )
    })
  })
  it('renders the button as disabled when the slot is full for waste chute', () => {
    props = {
      ...props,
      trashName: 'wasteChute',
    }
    vi.mocked(getSlotIsEmpty).mockReturnValue(false)
    render(props)
    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled()
  })
})
