import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { SourceWellViewContainer } from '../SourceWellViewContainer'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof SourceWellViewContainer>) => {
  return renderWithProviders(<SourceWellViewContainer {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SourceWellViewContainer', () => {
  let props: ComponentProps<typeof SourceWellViewContainer>
  beforeEach(() => {
    props = {
      protocolKey: 'mockProtocolKey',
    }
  })
  it('render text', () => {
    render(props)
    screen.getByText('Source well view')
    screen.getByText('Well A1')
  })
})
