import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { getCustomLabwareDirectory } from '../../../redux/custom-labware'
import {
  useTrackEvent,
  ANALYTICS_CHANGE_CUSTOM_LABWARE_SOURCE_FOLDER,
} from '../../../redux/analytics'

import { AdditionalCustomLabwareSourceFolder } from '../AdditionalCustomLabwareSourceFolder'

jest.mock('../../../redux/custom-labware')
jest.mock('../../../redux/analytics')

const render = () => {
  return renderWithProviders(<AdditionalCustomLabwareSourceFolder />, {
    i18nInstance: i18n,
  })
}

const mockTrackEvent = jest.fn()

const mockGetCustomLabwarePath = getCustomLabwareDirectory as jest.MockedFunction<
  typeof getCustomLabwareDirectory
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>

describe('AdditionalCustomLabwareSourceFolder', () => {
  beforeEach(() => {
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    mockGetCustomLabwarePath.mockReturnValue('')
  })

  it('renders the custom labware section with source folder selected', () => {
    mockGetCustomLabwarePath.mockReturnValue('/mock/custom-labware-path')
    render()
    screen.getByText(
      'If you want to specify a folder to manually manage Custom Labware files, you can add the directory here.'
    )
    screen.getByText('Additional Source Folder')
    screen.getByRole('button', { name: 'Change labware source folder' })
  })

  it('renders the custom labware section with no source folder selected', () => {
    render()
    screen.getByText('No additional source folder specified')
    const btn = screen.getByRole('button', {
      name: 'Add labware source folder',
    })
    fireEvent.click(btn)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_CHANGE_CUSTOM_LABWARE_SOURCE_FOLDER,
      properties: {},
    })
  })
})
