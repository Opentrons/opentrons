import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { COLORS, renderWithProviders } from '@opentrons/components'
import { SimpleWizardModal } from '..'

const render = (props: React.ComponentProps<typeof SimpleWizardModal>) => {
  return renderWithProviders(<SimpleWizardModal {...props} />)[0]
}
describe('SimpleWizardModal', () => {
  let props: React.ComponentProps<typeof SimpleWizardModal>
  beforeEach(() => {
    props = {
      iconColor: COLORS.errorText,
      children: <div>children</div>,
      header: 'header',
      subHeader: 'subheader',
      onExit: jest.fn(),
      title: 'title',
      currentStep: 5,
      totalSteps: 7,
      isSuccess: false,
    }
  })
  it('renders the correct information when it is not success', () => {
    const { getByText, getByLabelText } = render(props)
    getByText('header')
    getByText('subheader')
    getByLabelText('ot-alert')
    getByText('title')
    const exitBtn = getByLabelText('Exit')
    fireEvent.click(exitBtn)
    expect(props.onExit).toHaveBeenCalled()
  })

  it('renders the correct information when it is success', () => {
    props = {
      ...props,
      isSuccess: true,
    }
    const { getByText, getByLabelText } = render(props)
    getByText('header')
    getByText('subheader')
    getByLabelText('ot-check')
    getByText('title')
    const exitBtn = getByLabelText('Exit')
    fireEvent.click(exitBtn)
    expect(props.onExit).toHaveBeenCalled()
  })
})
