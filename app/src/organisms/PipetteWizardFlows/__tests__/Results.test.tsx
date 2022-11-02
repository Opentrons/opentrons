import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { LEFT } from '@opentrons/shared-data'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { Results } from '../Results'
import { FLOWS } from '../constants'

const render = (props: React.ComponentProps<typeof Results>) => {
  return renderWithProviders(<Results {...props} />, {
    i18nInstance: i18n,
  })[0]
}
describe('Results', () => {
  let props: React.ComponentProps<typeof Results>
  beforeEach(() => {
    props = {
      proceed: jest.fn(),
      goBack: jest.fn(),
      mount: LEFT,
      flowType: FLOWS.CALIBRATE,
    }
  })
  it('renders the correct information when pipette cal is a success for calibrate flow', () => {
    const { getByText, getByRole } = render(props)
    getByText('Pipette Successfully Calibrated')
    const exit = getByRole('button', { name: 'exit' })
    fireEvent.click(exit)
    expect(props.proceed).toHaveBeenCalled()
  })
})
