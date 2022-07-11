import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { AddCustomLabwareSlideout } from '..'

jest.mock('../../../redux/custom-labware')
jest.mock('../../../pages/Labware/helpers/getAllDefs')

const render = (
  props: React.ComponentProps<typeof AddCustomLabwareSlideout>
) => {
  return renderWithProviders(
    <MemoryRouter>
      <AddCustomLabwareSlideout {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('AddCustomLabwareSlideout', () => {
  const props: React.ComponentProps<typeof AddCustomLabwareSlideout> = {
    isExpanded: true,
    onCloseClick: jest.fn(() => null),
    onSuccess: jest.fn(() => null),
    onFailure: jest.fn(() => null),
  }

  it('renders correct title and labware cards', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('Import a Custom Labware Definition')
    getByText('Or choose a file from your computer to upload.')
    getByRole('button', { name: 'Choose File' })
  })

  it('renders drag and drop section', () => {
    const [{ getByRole }] = render(props)
    getByRole('button', { name: 'browse' })
  })
})
