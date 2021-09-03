import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components/__utils__'
import { i18n } from '../../../../../i18n'
import { MultipleModulesModal } from '../MultipleModulesModal'

const render = (props: React.ComponentProps<typeof MultipleModulesModal>) => {
  return renderWithProviders(<MultipleModulesModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('MultipleModulesModal', () => {
  let props: React.ComponentProps<typeof MultipleModulesModal>
  beforeEach(() => {
    props = { onCloseClick: jest.fn() }
  })

  it('should render the correct header', () => {
    const { getByRole } = render(props)
    expect(getByRole('heading', { name: 'Multiple Modules Help' })).toBeTruthy()
  })
  it('should render the correct body', () => {
    const { getByRole, getByText } = render(props)
    getByText(
      'To use multiples of a module in one protocol, you need to plug in the module that’s in the lowest numbered deck slot in the lowest numbered USB port on the OT-2.'
    )
    getByText(
      'Currently, you can use multiple Magnetic Modules or multiple Temperature Modules. You won’t be able to load multiple Thermocycler Modules.'
    )
    expect(getByRole('heading', { name: 'Example' })).toBeTruthy()

    getByText(
      'Your protocol has 2 Temperature Modules. The Temperature Module attached to the first port starting from the left will be related to the first Temperature Module in your protocol while the second Temperature Module loaded would be related to the Temperature Module connected to the next port to the right. If using a hub, follow the same logic with the port ordered.'
    )
  })
  it('should render a link to the learn more page', () => {
    const { getByRole } = render(props)
    expect(
      getByRole('link', {
        name: 'Learn more about how to use multiples of a module',
      }).getAttribute('href')
    ).toBe(
      'https://support.opentrons.com/en/articles/5167312-using-modules-of-the-same-type-on-the-ot-2'
    )
  })
  it('should call onCloseClick when the close button is pressed', () => {
    const { getByRole } = render(props)
    expect(props.onCloseClick).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})