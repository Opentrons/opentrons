import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { DestinationLabwareContainer } from '../DestinationLabwareContainer'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof DestinationLabwareContainer>) => {
  return renderWithProviders(<DestinationLabwareContainer {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DestinationLabwareContainer', () => {
  let props: ComponentProps<typeof DestinationLabwareContainer>
  beforeEach(() => {
    props = {
      protocolKey: 'mockProtocolKey',
    }
  })
  it('render text', () => {
    render(props)
    screen.getByText('Destination labware')
    screen.getByText('destination labware name')
  })
})
