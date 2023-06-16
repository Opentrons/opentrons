import * as React from 'react'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import {
  getUpdateChannelOptions,
  updateConfigValue,
} from '../../../redux/config'

import { UpdateChannel } from '../UpdateChannel'

jest.mock('../../../redux/config')

const mockChannelOptions = [
  {
    label: 'Stable',
    value: 'latest',
  },
  { label: 'Beta', value: 'beta' },
  { label: 'Alpha', value: 'alpha' },
]

const mockSetCurrentOption = jest.fn()

const mockGetChannelOptions = getUpdateChannelOptions as jest.MockedFunction<
  typeof getUpdateChannelOptions
>
const mockUpdateConfigValue = updateConfigValue as jest.MockedFunction<
  typeof updateConfigValue
>

const render = (props: React.ComponentProps<typeof UpdateChannel>) => {
  return renderWithProviders(<UpdateChannel {...props} />, {
    i18nInstance: i18n,
  })
}

describe('UpdateChannel', () => {
  let props: React.ComponentProps<typeof UpdateChannel>
  beforeEach(() => {
    props = {
      setCurrentOption: mockSetCurrentOption,
      devToolsOn: false,
    }
    mockGetChannelOptions.mockReturnValue(mockChannelOptions)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render text and buttons', () => {
    const [{ getByText, queryByText }] = render(props)
    getByText('Update Channel')
    getByText(
      'Stable receives the latest stable releases. Beta allows you to try out new in-progress features before they launch in Stable channel, but they have not completed testing yet.'
    )
    getByText('Stable')
    getByText('Beta')
    expect(queryByText('Alpha')).not.toBeInTheDocument()
    expect(
      queryByText(
        'Warning: alpha releases are feature-complete but may contain significant bugs.'
      )
    ).not.toBeInTheDocument()
  })

  it('should render alpha when dev tools on', () => {
    props.devToolsOn = true
    const [{ getByText }] = render(props)
    getByText('Alpha')
    getByText(
      'Warning: alpha releases are feature-complete but may contain significant bugs.'
    )
  })

  it('should call mock function when tapping a channel button', () => {
    const [{ getByText }] = render(props)
    const button = getByText('Stable')
    fireEvent.click(button)
    expect(mockUpdateConfigValue).toHaveBeenCalled()
  })

  it('should call mock function when tapping back button', () => {
    const [{ getByTestId }] = render(props)
    const button = getByTestId('UpdateChannel_back_button')
    fireEvent.click(button)
    expect(props.setCurrentOption).toHaveBeenCalled()
  })
})
