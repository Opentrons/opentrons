import type * as React from 'react'
import { describe, it, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../assets/localization'
import { renderWithProviders } from '../../../__testing-utils__'
import { EditProtocolMetadataModal } from '..'
import { selectors as fileSelectors } from '../../../file-data'

vi.mock('../../../file-data')

const render = (
  props: React.ComponentProps<typeof EditProtocolMetadataModal>
) => {
  return renderWithProviders(<EditProtocolMetadataModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('EditProtocolMetadataModal', () => {
  let props: React.ComponentProps<typeof EditProtocolMetadataModal>

  beforeEach(() => {
    props = {
      onClose: vi.fn(),
    }
    vi.mocked(fileSelectors.getFileMetadata).mockReturnValue({
      protocolName: 'mockName',
      author: 'mockAuthor',
      description: 'mockDescription',
    })
  })

  it('renders all the text and fields', () => {
    render(props)
    screen.getByText('Edit protocol metadata')
    screen.getByText('Name')
    screen.getByText('Description')
    screen.getByText('Author/Organization')
    let input = screen.getAllByRole('textbox', { name: '' })[1]
    fireEvent.change(input, { target: { value: 'mockProtocolName' } })
    input = screen.getAllByRole('textbox', { name: '' })[2]
    fireEvent.change(input, { target: { value: 'mock org' } })
    screen.getByText('Save')
  })
})
