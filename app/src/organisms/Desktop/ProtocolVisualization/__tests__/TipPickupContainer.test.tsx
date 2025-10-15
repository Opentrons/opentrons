import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { TipPickupContainer } from '../TipPickupContainer'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof TipPickupContainer>) => {
  return renderWithProviders(<TipPickupContainer {...props} />, {
    i18nInstance: i18n,
  })
}

describe('TipPickupContainer', () => {
  let props: ComponentProps<typeof TipPickupContainer>
  beforeEach(() => {
    props = {
      protocolKey: 'mockProtocolKey',
    }
  })
  it('render text', () => {
    render(props)
    screen.getByText('Tip pickup')
    screen.getByText('tip rack name')
    screen.getByText('Tips remaining')
    screen.getByText('10 tips')
  })
})
