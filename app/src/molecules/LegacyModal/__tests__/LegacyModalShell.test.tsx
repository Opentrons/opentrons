import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

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
    const [{ getByText, getByLabelText }] = render(props)
    getByText('mock modal shell')
    expect(getByLabelText('ModalShell_ModalArea')).toHaveStyle('height: auto')
  })

  it('should render full size modal when fullSize is true', () => {
    props.fullPage = true
    const [{ getByLabelText }] = render(props)
    expect(getByLabelText('ModalShell_ModalArea')).toHaveStyle('height: 100%')
  })

  it('should render header and footer', () => {
    props.header = <div>mock header</div>
    props.footer = <div>mock footer</div>
    const [{ getByText }] = render(props)
    getByText('mock header')
    getByText('mock footer')
  })
})
