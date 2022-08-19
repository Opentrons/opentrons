import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { InProgressModal } from '../InProgressModal'

const render = (props: React.ComponentProps<typeof InProgressModal>) => {
  return renderWithProviders(<InProgressModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}
describe('InProgressModal', () => {
  let props: React.ComponentProps<typeof InProgressModal>
  beforeEach(() => {
    props = {
      title: 'Attach a pipette',
      currentStep: 1,
      totalSteps: 6,
    }
  })
  it('renders the correct text', () => {
    const { getByText, getByLabelText } = render(props)
    getByText('Attach a pipette')
    getByText('Moving gantry...')
    getByText('Step: 1 / 6')
    getByLabelText('spinner')
  })
})
