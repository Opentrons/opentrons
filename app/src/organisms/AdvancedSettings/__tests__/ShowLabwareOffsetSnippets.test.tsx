import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'

import { i18n } from '../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import {
  getIsLabwareOffsetCodeSnippetsOn,
  updateConfigValue,
} from '../../../redux/config'
import { ShowLabwareOffsetSnippets } from '../ShowLabwareOffsetSnippets'

jest.mock('../../../redux/config')

const mockGetIsLabwareOffsetCodeSnippetsOn = getIsLabwareOffsetCodeSnippetsOn as jest.MockedFunction<
  typeof getIsLabwareOffsetCodeSnippetsOn
>
const mockUpdateConfigValue = updateConfigValue as jest.MockedFunction<
  typeof updateConfigValue
>

const render = () => {
  return (
    renderWithProviders(<ShowLabwareOffsetSnippets />),
    {
      i18nInstance: i18n,
    }
  )
}

describe('ShowLabwareOffsetSnippets', () => {
  beforeEach(() => {
    mockGetIsLabwareOffsetCodeSnippetsOn.mockReturnValue(true)
  })
  it('renders the display show link to get labware offset data section', () => {
    render()
    screen.getByText('Show Labware Offset data code snippets')
    screen.getByText(
      'Only for users who need to apply Labware Offset data outside of the Opentrons App. When enabled, code snippets for Jupyter Notebook and SSH are available during protocol setup.'
    )
    screen.getByRole('switch', { name: 'show_link_to_get_labware_offset_data' })
  })

  it('should call a mock function when clicking toggle button', () => {
    render()
    const toggleButton = screen.getByRole('switch', {
      name: 'show_link_to_get_labware_offset_data',
    })
    fireEvent.click(toggleButton)
    expect(mockUpdateConfigValue).toHaveBeenCalledWith(
      'labware.showLabwareOffsetCodeSnippets',
      false
    )
  })
})
