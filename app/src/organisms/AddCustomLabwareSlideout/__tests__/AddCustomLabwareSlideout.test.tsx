import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import {
  useTrackEvent,
  ANALYTICS_ADD_CUSTOM_LABWARE,
} from '../../../redux/analytics'
import { AddCustomLabwareSlideout } from '..'

jest.mock('../../../redux/custom-labware')
jest.mock('../../../pages/Labware/helpers/getAllDefs')
jest.mock('../../../redux/analytics')

const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>

let mockTrackEvent: jest.Mock

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
  }
  beforeEach(() => {
    mockTrackEvent = jest.fn()
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
  })

  it('renders correct title and labware cards and clicking on button triggers analytics event', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('Import a Custom Labware Definition')
    getByText('Or choose a file from your computer to upload.')
    const btn = getByRole('button', { name: 'Upload' })
    fireEvent.click(btn)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_ADD_CUSTOM_LABWARE,
      properties: {},
    })
  })

  it('renders drag and drop section', () => {
    const [{ getByRole }] = render(props)
    getByRole('button', { name: 'browse' })
  })
})
