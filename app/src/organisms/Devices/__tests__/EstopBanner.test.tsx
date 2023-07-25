import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { EstopBanner } from '../EstopBanner'

const render = () =>
  renderWithProviders(<EstopBanner />, { i18nInstance: i18n })

describe('EstopBanner', () => {
  it(
    'should render text and call a mock function when tapping text button - estop physicallyEngaged'
  )
  it(
    'should render text and call a mock function when tapping text button - estop logicallyEngaged'
  )
  it(
    'should render text and call a mock function when tapping text button - estop notPresent'
  )
})
