import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { MenuList } from '..'

const render = (props: React.ComponentProps<typeof MenuList>) => {
  return renderWithProviders(<MenuList {...props} />)[0]
}

describe(' MenuList', () => {
  let props: React.ComponentProps<typeof MenuList>
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
