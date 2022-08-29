import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ExitModal } from '../ExitModal'

const render = (props: React.ComponentProps<typeof ExitModal>) => {
  return renderWithProviders(<ExitModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}
describe('ExitModal', () => {
  let props: React.ComponentProps<typeof ExitModal>
  beforeEach(() => {
    props = {
      back: jest.fn(),
      exit: jest.fn(),
      direction: 'attach',
    }
  })
  it('renders the correct information and buttons for attach when no pipette is attached', () => {
    const { getByText, getByRole } = render(props)
    getByText('Progress will be lost')
    getByText('Are you sure you want to exit before attaching your pipette?')
    const back = getByRole('button', { name: 'Go back' })
    const exit = getByRole('button', { name: 'exit' })
    fireEvent.click(back)
    expect(props.back).toHaveBeenCalled()
    fireEvent.click(exit)
    expect(props.exit).toHaveBeenCalled()
  })

  it('renders the correct text and body text for detach when no pipette is attached', () => {
    props = {
      ...props,
      direction: 'detach',
    }
    const { getByText } = render(props)
    getByText('Are you sure you want to exit before detaching your pipette?')
  })
})
