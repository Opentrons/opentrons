import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { DestinationWellViewContainer } from '../DestinationWellViewContainer'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof DestinationWellViewContainer>) => {
  return renderWithProviders(<DestinationWellViewContainer {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DestinationWellViewContainer', () => {
  let props: ComponentProps<typeof DestinationWellViewContainer>
  beforeEach(() => {
    props = {
      protocolKey: 'mockProtocolKey',
    }
  })
  it('render text', () => {
    render(props)
    screen.getByText('Destination well view')
    screen.getByText('Well A1')
  })
})
