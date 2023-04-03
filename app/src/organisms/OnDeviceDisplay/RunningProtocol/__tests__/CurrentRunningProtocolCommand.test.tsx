import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'

import { CurrentRunningProtocolCommand } from '../CurrentRunningProtocolCommand'

const render = (
  props: React.ComponentProps<typeof CurrentRunningProtocolCommand>
) => {
  return renderWithProviders(<CurrentRunningProtocolCommand {...props} />, {
    i18nInstance: i18n,
  })
}

describe('CurrentRunningProtocolCommand', () => {
  it('should render text and buttons', () => {})
})
