import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { TipDisposalContainer } from '../TipDisposalContainer'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof TipDisposalContainer>) => {
  return renderWithProviders(<TipDisposalContainer {...props} />, {
    i18nInstance: i18n,
  })
}

describe('TipPickupContainer', () => {
  let props: ComponentProps<typeof TipDisposalContainer>
  beforeEach(() => {
    props = {
      protocolKey: 'mockProtocolKey',
    }
  })
  it('render text', () => {
    render(props)
    screen.getByText('Tip disposal')
    screen.getByText('Tips in trash')
    screen.getByText('10 tips')
    screen.getByText('Lids in trash')
    screen.getByText('lids num')
  })
})
