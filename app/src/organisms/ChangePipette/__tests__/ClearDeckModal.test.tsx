import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ClearDeckModal } from '../ClearDeckModal'

const render = (props: React.ComponentProps<typeof ClearDeckModal>) => {
  return renderWithProviders(<ClearDeckModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}
describe('ClearDeckModal', () => {
  let props: React.ComponentProps<typeof ClearDeckModal>
  beforeEach(() => {
    props = {
      onContinueClick: jest.fn(),
    }
  })
  it('renders the correct information when pipette is not attached', () => {
    const { getByText } = render(props)
    getByText('Before you begin')
    getByText(
      'Before starting, remove all labware from the deck and all tips from pipettes. The gantry will move to the front of the robot.'
    )
  })

  it('renders the correct information when pipette is attached', () => {
    const { getByText, getByRole } = render(props)
    getByText('Before you begin')
    getByText(
      'Before starting, remove all labware from the deck and all tips from pipettes. The gantry will move to the front of the robot.'
    )
    const cont = getByRole('button', { name: 'Get started' })
    fireEvent.click(cont)
    expect(props.onContinueClick).toHaveBeenCalled()
  })
})
