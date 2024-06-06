import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../i18n'
import {
  useTrackEvent,
  ANALYTICS_ADD_CUSTOM_LABWARE,
} from '../../../redux/analytics'
import { renderWithProviders } from '../../../__testing-utils__'
import { AddCustomLabwareSlideout } from '..'

vi.mock('../../../redux/custom-labware')
vi.mock('../../../pages/Labware/helpers/getAllDefs')
vi.mock('../../../redux/analytics')

let mockTrackEvent: any

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
    onCloseClick: vi.fn(() => null),
  }
  beforeEach(() => {
    mockTrackEvent = vi.fn()
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
  })

  it('renders correct title and labware cards and clicking on button triggers analytics event', () => {
    render(props)
    screen.getByText('Import a Custom Labware Definition')
    screen.getByText('Or choose a file from your computer to upload.')
    const btn = screen.getByRole('button', { name: 'Upload' })
    fireEvent.click(btn)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_ADD_CUSTOM_LABWARE,
      properties: {},
    })
  })

  it('renders drag and drop section', () => {
    render(props)
    screen.getByRole('button', { name: 'browse' })
  })
})
