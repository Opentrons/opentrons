import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import { HeaterShakerBanner } from '../HeaterShakerBanner'

import type { ModuleDefinition } from '@opentrons/shared-data'

const render = (props: React.ComponentProps<typeof HeaterShakerBanner>) => {
  return renderWithProviders(<HeaterShakerBanner {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockHeaterShakerStub = {
  displayName: 'Heater Shaker Module GEN1',
} as ModuleDefinition
describe('HeaterShakerBanner', () => {
  let props: React.ComponentProps<typeof HeaterShakerBanner>
  beforeEach(() => {
    props = { moduleDef: mockHeaterShakerStub }
  })

  it('should render the correct header and body', () => {
    const { getByText } = render(props)
    getByText('Slot 1')
    getByText('Heater Shaker Module GEN1')
    getByText(
      'Attach the module to the robot deck to prevent module from shaking out of a deck slot.'
    )
  })

  it('should render button and it is clickable', () => {
    const { getByRole } = render(props)
    const wizardButton = getByRole('button', {
      name: 'See how to attach module to deck',
    })
    fireEvent.click(wizardButton)
    expect(wizardButton).toBeEnabled()
  })
})
