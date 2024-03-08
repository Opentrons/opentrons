import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, it, beforeEach, vi, expect } from 'vitest'
import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../i18n'
import { getIsOnDevice } from '../../../../../redux/config'
import { MultipleModulesModal } from '../MultipleModulesModal'

vi.mock('../../../../../redux/config')

const render = (props: React.ComponentProps<typeof MultipleModulesModal>) => {
  return renderWithProviders(<MultipleModulesModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('MultipleModulesModal', () => {
  let props: React.ComponentProps<typeof MultipleModulesModal>
  beforeEach(() => {
    props = { onCloseClick: vi.fn() }
    vi.mocked(getIsOnDevice).mockReturnValue(false)
  })

  it('should render the correct header', () => {
    render(props)
    screen.getByRole('heading', {
      name: 'Setting up multiple modules of the same type',
    })
  })
  it('should render the correct body', () => {
    render(props)
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
    render(props)
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
  it('should call onCloseClick when the close button is pressed', () => {
    render(props)
    expect(props.onCloseClick).not.toHaveBeenCalled()
    const closeButton = screen.getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
  it('should render the correct text and img for on device display', () => {
    vi.mocked(getIsOnDevice).mockReturnValue(true)
    render(props)
    screen.getByText(
      'You can use multiples of most module types within a single Python protocol by connecting and loading the modules in a specific order. The robot will initialize the matching module attached to the lowest numbered port first, regardless of what deck slot it occupies.'
    )
    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe(
      '/app/src/assets/images/on-device-display/multiple_modules_modal.png'
    )
    screen.getByAltText('2 temperature modules plugged into the usb ports')
  })
})
