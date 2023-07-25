import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { EstopBanner } from '../EstopBanner'

const render = (props: React.ComponentProps<typeof EstopBanner>) =>
  renderWithProviders(<EstopBanner {...props} />, { i18nInstance: i18n })

describe('EstopBanner', () => {
  let props: React.ComponentProps<typeof EstopBanner>
  beforeEach(() => {
    props = {
      status: 'physicallyEngaged',
    }
  })

  it('should render text and call a mock function when tapping text button - estop physicallyEngaged', () => {
    const [{ getByText }] = render(props)
    getByText('E-stop pressed. Robot movement is halted.')
    getByText('Reset E-stop')
  })
  it('should render text and call a mock function when tapping text button - estop logicallyEngaged', () => {
    props.status = 'logicallyEngaged'
    const [{ getByText }] = render(props)
    getByText('E-stop disengaged, but robot operation still halted.')
    getByText('Resume operation')
  })
  it('should render text and call a mock function when tapping text button - estop notPresent', () => {
    props.status = 'notPresent'
    const [{ getByText }] = render(props)
    getByText('E-stop disconnected. Robot movement is halted.')
    getByText('Resume operation')
  })
})
