import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { CheckZAxisButton } from '../CheckZaxisButton'

const render = (props: React.ComponentProps<typeof CheckZAxisButton>) => {
  return renderWithProviders(<CheckZAxisButton {...props} />)[0]
}

describe('CheckZAxisButton', () => {
  let props: React.ComponentProps<typeof CheckZAxisButton>
  beforeEach(() => {
    props = {
      proceedButtonText: 'continue',
      setZAxisScrewStatus: jest.fn(),
      numberOfTryAgains: 0,
      setNumberOfTryAgains: jest.fn(),
    }
  })
  it('clicking on the button calls setZAxisScrewStatus and setNumberOfTryAgains prop', () => {
    const { getByRole } = render(props)
    getByRole('button', { name: 'continue' }).click()
    expect(props.setZAxisScrewStatus).toHaveBeenCalled()
    expect(props.setNumberOfTryAgains).toHaveBeenCalled()
  })
})
