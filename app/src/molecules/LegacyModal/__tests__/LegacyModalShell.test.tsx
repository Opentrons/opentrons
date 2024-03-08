import * as React from 'react'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'

import { LegacyModalShell } from '../LegacyModalShell'

const render = (props: React.ComponentProps<typeof LegacyModalShell>) => {
  return renderWithProviders(<LegacyModalShell {...props} />)
}

describe('LegacyModalShell', () => {
  let props: React.ComponentProps<typeof LegacyModalShell>

  beforeEach(() => {
    props = {
      children: <div>mock modal shell</div>,
      fullPage: false,
    }
  })

  it('should render content', () => {
    render(props)
    screen.getByText('mock modal shell')
    expect(screen.getByLabelText('ModalShell_ModalArea')).toHaveStyle(
      'height: auto'
    )
  })

  it('should render full size modal when fullSize is true', () => {
    props.fullPage = true
    render(props)
    expect(screen.getByLabelText('ModalShell_ModalArea')).toHaveStyle(
      'height: 100%'
    )
  })

  it('should render header and footer', () => {
    props.header = <div>mock header</div>
    props.footer = <div>mock footer</div>
    render(props)
    screen.getByText('mock header')
    screen.getByText('mock footer')
  })
})
