import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ExitModal } from '../ExitModal'
import { LEFT } from '@opentrons/shared-data'

const render = (props: React.ComponentProps<typeof ExitModal>) => {
  return renderWithProviders(<ExitModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}
describe('CExitModal', () => {
  let props: React.ComponentProps<typeof ExitModal>
  beforeEach(() => {
    props = {
      back: jest.fn(),
      exit: jest.fn(),
      direction: 'attach',
      currentStep: 4,
      totalSteps: 8,
      mount: LEFT,
    }
  })
  it('renders the correct information and buttons for attach when no pipette is attached', () => {
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Attach a pipette')
    getByText('Step: 4 / 8')
    getByText('Progress will be lost')
    getByText('Are you sure you want to exit before attaching your pipette?')
    const back = getByRole('button', { name: 'Go back' })
    const exitIcon = getByLabelText('Exit')
    const exit = getByRole('button', { name: 'exit' })
    fireEvent.click(back)
    expect(props.back).toHaveBeenCalled()
    fireEvent.click(exit)
    expect(props.exit).toHaveBeenCalled()
    fireEvent.click(exitIcon)
    expect(props.exit).toHaveBeenCalled()
  })

  it('renders the correct wizardHeader text and body text for detach when no pipette is attached', () => {
    props = {
      ...props,
      direction: 'detach',
    }
    const { getByText } = render(props)
    getByText('Detach pipette')
    getByText('Are you sure you want to exit before detaching your pipette?')
  })

  it('renders the correct wizardHeader text for attach when pipette is attached', () => {
    props = {
      ...props,
      displayName: 'P10 Single-Channel GEN1',
    }
    const { getByText } = render(props)
    getByText('Attach a P10 Single-Channel GEN1 pipette')
  })

  it('renders the correct wizardHeader text for detach when pipette is attached', () => {
    props = {
      ...props,
      direction: 'detach',
      displayName: 'P10 Single-Channel GEN1',
    }
    const { getByText } = render(props)
    getByText('Detach P10 Single-Channel GEN1 from Left Mount')
  })
})
