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
      onCancelClick: jest.fn(),
      totalSteps: 5,
      currentStep: 1,
      title: 'Attach a pipette',
    }
  })
  it('renders the correct information when pipette is not attached', () => {
    const { getByText, getByRole } = render(props)
    getByText('Attach a pipette')
    getByText('Before you begin')
    getByText(
      'Before starting, remove all labware from the deck and all tips from pipettes. The gantry will move to the front of the robot.'
    )
    const exit = getByRole('button', { name: 'Exit' })
    fireEvent.click(exit)
    expect(props.onCancelClick).toHaveBeenCalled()
    const cont = getByRole('button', { name: 'Get started' })
    fireEvent.click(cont)
    expect(props.onContinueClick).toHaveBeenCalled()
  })

  it('renders the correct information when a p10 single gen 1 is attached', () => {
    props = {
      ...props,
      title: 'Detach P10 Single-Channel GEN1 from Right Mount',
    }
    const { getByText, getByRole } = render(props)
    getByText('Detach P10 Single-Channel GEN1 from Right Mount')
    getByText('Before you begin')
    getByText(
      'Before starting, remove all labware from the deck and all tips from pipettes. The gantry will move to the front of the robot.'
    )
    const exit = getByRole('button', { name: 'Exit' })
    fireEvent.click(exit)
    expect(props.onCancelClick).toHaveBeenCalled()
    const cont = getByRole('button', { name: 'Get started' })
    fireEvent.click(cont)
    expect(props.onContinueClick).toHaveBeenCalled()
  })
})
