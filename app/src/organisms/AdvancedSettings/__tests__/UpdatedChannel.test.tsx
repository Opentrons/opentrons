import * as React from 'react'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import {
  getUpdateChannelOptions,
  getUpdateChannel,
  // updateConfigValue,
} from '../../../redux/config'
import { UpdatedChannel } from '../UpdatedChannel'

jest.mock('../../../redux/config')

const render = () => {
  return renderWithProviders(<UpdatedChannel />, { i18nInstance: i18n })
}

const mockGetUpdateChannelOptions = getUpdateChannelOptions as jest.MockedFunction<
  typeof getUpdateChannelOptions
>
const mockGetUpdateChannel = getUpdateChannel as jest.MockedFunction<
  typeof getUpdateChannel
>
// const mockUpdateConfigValue = updateConfigValue as jest.MockedFunction<
//   typeof updateConfigValue
// >

describe('UpdatedChannel', () => {
  beforeEach(() => {
    mockGetUpdateChannelOptions.mockReturnValue([
      {
        label: 'Stable',
        value: 'latest',
      },
      { label: 'Beta', value: 'beta' },
      { label: 'Alpha', value: 'alpha' },
    ])
    mockGetUpdateChannel.mockReturnValue('beta')
  })
  it('renders text and selector', () => {
    render()
    screen.getByText('Update Channel')
    screen.getByText(
      'Stable receives the latest stable releases. Beta allows you to try out new in-progress features before they launch in Stable channel, but they have not completed testing yet.'
    )
    screen.getByRole('combobox', { name: '' })
    screen.getByText('beta')
  })

  // it('should call a mock function when selecting a channel', () => {
  //   render()
  //   const selectedOption = screen.getByRole('combobox')
  //   fireEvent.change(selectedOption, { target: { value: 'alpha' } })
  //   expect(mockUpdateConfigValue).toHaveBeenCalledWith(
  //     'update.channel',
  //     'alpha'
  //   )
  // })
})
