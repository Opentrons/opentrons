import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'

import { RunningProtocolCommandList } from '../RunningProtocolCommandList'

const render = (
  props: React.ComponentProps<typeof RunningProtocolCommandList>
) => {
  return renderWithProviders(<RunningProtocolCommandList {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RunningProtocolCommandList', () => {
  let props: React.ComponentProps<typeof RunningProtocolCommandList>
  beforeEach(() => {})
  it('should render text and buttons', () => {})
})
