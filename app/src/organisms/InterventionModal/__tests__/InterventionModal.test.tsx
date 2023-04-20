import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { InterventionModal } from '..'

const ROBOT_NAME = 'Otie'

const render = (props: React.ComponentProps<typeof InterventionModal>) => {
  return renderWithProviders(<InterventionModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('InterventionModal', () => {
  let props: React.ComponentProps<typeof InterventionModal>
  beforeEach(() => {
    props = { robotName: ROBOT_NAME }
  })

  it('renders an InterventionModal with the robot name in the header, learn more link, and confirm button', () => {
    const { getByText, getByRole } = render(props)
    expect(getByText('Perform manual step on Otie')).toBeTruthy()
    expect(getByText('Learn more about user interventions')).toBeTruthy()
    expect(getByRole('button', { name: 'Confirm and resume' })).toBeTruthy()
  })
})
