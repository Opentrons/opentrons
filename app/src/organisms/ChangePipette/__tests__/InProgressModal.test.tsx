import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT, RIGHT } from '@opentrons/shared-data'
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
      currentStep: 5,
      totalSteps: 6,
      mount: LEFT,
      movementStatus: 'moving',
      isPipetteHoming: false,
    }
  })
  it('renders the correct text if status is moving and not homing on left mount', () => {
    const { getByText, getByLabelText } = render(props)
    getByText('Attach a pipette')
    getByText('Moving gantry')
    getByText('Left pipette carriage moving to front right.')
    getByLabelText('spinner')
  })

  it('renders the correct text if status is moving and not homing on right mount', () => {
    props = {
      ...props,
      mount: RIGHT,
    }
    const { getByText, getByLabelText } = render(props)
    getByText('Attach a pipette')
    getByText('Moving gantry')
    getByText('Right pipette carriage moving to front left.')
    getByLabelText('spinner')
  })

  it('renders the correct text if status is homing and pipette homing on right mount', () => {
    props = {
      ...props,
      mount: RIGHT,
      movementStatus: 'homing',
      isPipetteHoming: true,
    }
    const { getByText, getByLabelText } = render(props)
    getByText('Attach a pipette')
    getByText('Moving gantry')
    getByText('Right pipette carriage moving up.')
    getByLabelText('spinner')
  })

  it('renders the correct text if status is homing', () => {
    props = {
      ...props,
      mount: RIGHT,
      movementStatus: 'homing',
      isPipetteHoming: false,
    }
    const { getByText, getByLabelText } = render(props)
    getByText('Attach a pipette')
    getByText('Moving gantry')
    getByText('Robot is homing')
    getByLabelText('spinner')
  })

  it('renders the correct text if there is an error', () => {
    props = {
      ...props,
      movementStatus: 'moveError',
    }
    const { getByText, getByLabelText } = render(props)
    getByText('Attach a pipette')
    getByText('Moving gantry')
    getByLabelText('spinner')
  })
})
