import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { OverflowMenu } from '..'

const render = (props: React.ComponentProps<typeof OverflowMenu>) => {
  return renderWithProviders(<OverflowMenu {...props} />)[0]
}

describe('OverflowMenu', () => {
  let props: React.ComponentProps<typeof OverflowMenu>
  beforeEach(() => {
    props = {
      children: <div>child</div>,
    }
  })

  it('renders a child', () => {
    const { getByText } = render(props)
    getByText('child')
  })
})
