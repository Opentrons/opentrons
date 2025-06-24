import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { EditLabwareQuantityModal } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import {
  createContainer,
  deleteContainer,
} from '../../../../labware-ingred/actions'
import { getLabwareEntities } from '../../../../step-forms/selectors'

import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../../../../labware-ingred/actions')
vi.mock('../../../../step-forms/selectors')
const render = (props: ComponentProps<typeof EditLabwareQuantityModal>) => {
  return renderWithProviders(<EditLabwareQuantityModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('EditLabwareQuantityModal', () => {
  let props: ComponentProps<typeof EditLabwareQuantityModal>

  beforeEach(() => {
    vi.clearAllMocks()
    props = {
      isDirectlyOnDeck: false,
      onClose: vi.fn(),
      labwareId: 'mockId',
      allLabwareIdsOnStack: ['mockId'],
    }
    vi.mocked(getLabwareEntities).mockReturnValue({
      mockId: {
        id: 'mockId',
        labwareDefURI: 'mockDefUri',
        pythonName: 'mockPythonName',
        def: { ...fixture96Plate, stackLimit: 3 } as LabwareDefinition2,
      },
    })
  })

  it('renders the text and changes the quantity to 2', () => {
    render(props)
    screen.getByText('Edit labware quantity')
    screen.getByText('Labware quantity')
    screen.getByText('Valid range between 1-3')

    fireEvent.click(screen.getByText('Cancel'))
    expect(props.onClose).toHaveBeenCalled()

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '2' } })
    fireEvent.click(screen.getByText('Confirm quantity'))
    expect(vi.mocked(deleteContainer)).not.toHaveBeenCalled()
    expect(vi.mocked(createContainer)).toHaveBeenCalledOnce()
    expect(props.onClose).toHaveBeenCalled()
  })
  it('renders changes the quantity from 2 to 1', () => {
    props.allLabwareIdsOnStack = ['mockId', 'mockId2']
    render(props)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '1' } })
    fireEvent.click(screen.getByText('Confirm quantity'))
    //   delete the 2nd labware in quantity
    expect(vi.mocked(deleteContainer)).toHaveBeenCalledOnce()
    expect(vi.mocked(createContainer)).not.toHaveBeenCalled()
    expect(props.onClose).toHaveBeenCalled()
  })
  it('renders the error copy when you try to confirm', () => {
    props.allLabwareIdsOnStack = ['mockId', 'mockId2']
    render(props)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '4' } })
    fireEvent.click(screen.getByText('Confirm quantity'))
    expect(vi.mocked(deleteContainer)).not.toHaveBeenCalledOnce()
    expect(vi.mocked(createContainer)).not.toHaveBeenCalled()
    screen.getByText('Enter a value within the specified range')
  })
})
