import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  ANALYTICS_CHANGE_CUSTOM_LABWARE_SOURCE_FOLDER,
  useTrackEvent,
} from '/app/redux/analytics'
import { getCustomLabwareDirectory } from '/app/redux/custom-labware'

import { AdditionalCustomLabwareSourceFolder } from '../AdditionalCustomLabwareSourceFolder'

vi.mock('/app/redux/custom-labware')
vi.mock('/app/redux/analytics')

const render = () => {
  return renderWithProviders(<AdditionalCustomLabwareSourceFolder />, {
    i18nInstance: i18n,
  })
}

const mockTrackEvent = vi.fn()

describe('AdditionalCustomLabwareSourceFolder', () => {
  beforeEach(() => {
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
    vi.mocked(getCustomLabwareDirectory).mockReturnValue('')
  })

  it('renders the custom labware section with source folder selected', () => {
    vi.mocked(getCustomLabwareDirectory).mockReturnValue(
      '/mock/custom-labware-path'
    )
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
