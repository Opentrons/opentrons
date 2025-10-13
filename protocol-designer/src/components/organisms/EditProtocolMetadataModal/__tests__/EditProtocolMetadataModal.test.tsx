import { beforeEach, describe, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { selectors as fileSelectors } from '/protocol-designer/file-data'

import { EditProtocolMetadataModal } from '..'

import type { ComponentProps } from 'react'

vi.mock('/protocol-designer/file-data')

const render = (props: ComponentProps<typeof EditProtocolMetadataModal>) => {
  return renderWithProviders(<EditProtocolMetadataModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('EditProtocolMetadataModal', () => {
  let props: ComponentProps<typeof EditProtocolMetadataModal>

  beforeEach(() => {
    props = {
      onClose: vi.fn(),
    }
    vi.mocked(fileSelectors.getFileMetadata).mockReturnValue({
      protocolName: 'mockName',
      author: 'mockAuthor',
      description: 'mockDescription',
      created: 1676913200000,
      lastModified: 1676913200000,
      category: 'mockCategory',
      subcategory: 'mockSubcategory',
      tags: ['mockTag1', 'mockTag2'],
      source: 'mockSource',
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
