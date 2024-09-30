import { fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, it, beforeEach, vi, expect } from 'vitest'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { getIsOnDevice } from '/app/redux/config'
import { OT2MultipleModulesHelp } from '../OT2MultipleModulesHelp'

vi.mock('/app/redux/config')

const render = () =>
  renderWithProviders(<OT2MultipleModulesHelp />, {
    i18nInstance: i18n,
  })[0]

describe('OT2MultipleModulesHelp', () => {
  beforeEach(() => {
    vi.mocked(getIsOnDevice).mockReturnValue(false)
  })

  it('should render the correct header', () => {
    render()
    fireEvent.click(screen.getByText('Learn more'))
    screen.getByRole('heading', {
      name: 'Setting up multiple modules of the same type',
    })
  })
  it('should render the correct body', () => {
    render()
    fireEvent.click(screen.getByText('Learn more'))
    screen.getByText(
      'To use more than one of the same module in a protocol, you first need to plug in the module that’s called first in your protocol to the lowest numbered USB port on the robot. Continue in the same manner with additional modules.'
    )
    screen.getByText('Example')
    screen.getByText(
      'Your protocol has two Temperature Modules. The Temperature Module attached to the first port starting from the left will be related to the first Temperature Module in your protocol while the second Temperature Module loaded would be related to the Temperature Module connected to the next port to the right. If using a hub, follow the same logic with the port ordering.'
    )
    screen.getByAltText('2 temperature modules plugged into the usb ports')
  })
  it('should render a link to the learn more page', () => {
    render()
    fireEvent.click(screen.getByText('Learn more'))
    expect(
      screen
        .getByRole('link', {
          name: 'Learn more about using multiple modules of the same type',
        })
        .getAttribute('href')
    ).toBe(
      'https://support.opentrons.com/s/article/Using-modules-of-the-same-type-on-the-OT-2'
    )
  })
  it('should call close info modal when the close button is pressed', () => {
    render()
    fireEvent.click(screen.getByText('Learn more'))
    const closeButton = screen.getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(
      screen.queryByText('Setting up multiple modules of the same type')
    ).toBeNull()
  })
})
