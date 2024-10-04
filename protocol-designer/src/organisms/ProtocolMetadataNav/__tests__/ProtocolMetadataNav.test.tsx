import { screen } from '@testing-library/react'
import { describe, it, beforeEach, vi } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'
import { getFileMetadata } from '../../../file-data/selectors'

import { ProtocolMetadataNav } from '..'

vi.mock('../../../file-data/selectors')

const render = (props: React.ComponentProps<typeof ProtocolMetadataNav>) => {
  return renderWithProviders(<ProtocolMetadataNav {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolMetadataNav', () => {
  let props: React.ComponentProps<typeof ProtocolMetadataNav>
  beforeEach(() => {
    props = {
      isAddingHardwareOrLabware: false,
    }
    vi.mocked(getFileMetadata).mockReturnValue({
      protocolName: 'mockProtocolName',
      created: 123,
    })
  })

  it('should render protocol name and edit protocol - protocol name', () => {
    render(props)
    screen.getByText('mockProtocolName')
    screen.getByText('Edit protocol')
  })
  it('should render protocol name and edit protocol - no protocol name', () => {
    vi.mocked(getFileMetadata).mockReturnValue({})
    render(props)
    screen.getByText('Untitled protocol')
    screen.getByText('Edit protocol')
  })

  it('should render protocol name and add hardware/labware - protocol name', () => {
    props = { isAddingHardwareOrLabware: true }
    render(props)
    screen.getByText('mockProtocolName')
    screen.getByText('Add hardware/labware')
  })
  it('should render protocol name and add hardware/labware - no protocol name', () => {
    props = { isAddingHardwareOrLabware: true }
    vi.mocked(getFileMetadata).mockReturnValue({})
    render(props)
    screen.getByText('Untitled protocol')
    screen.getByText('Add hardware/labware')
  })
})
