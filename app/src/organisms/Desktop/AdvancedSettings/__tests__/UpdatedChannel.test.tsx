import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import { i18n } from '/app/i18n'
import {
  getUpdateChannelOptions,
  getUpdateChannel,
  // updateConfigValue,
} from '/app/redux/config'
import { UpdatedChannel } from '../UpdatedChannel'
import { renderWithProviders } from '/app/__testing-utils__'

vi.mock('/app/redux/config')

const render = () => {
  return renderWithProviders(<UpdatedChannel />, { i18nInstance: i18n })
}

describe('UpdatedChannel', () => {
  beforeEach(() => {
    vi.mocked(getUpdateChannelOptions).mockReturnValue([
      {
        label: 'Stable',
        value: 'latest',
      },
      { label: 'Beta', value: 'beta' },
      { label: 'Alpha', value: 'alpha' },
    ])
    vi.mocked(getUpdateChannel).mockReturnValue('beta')
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
