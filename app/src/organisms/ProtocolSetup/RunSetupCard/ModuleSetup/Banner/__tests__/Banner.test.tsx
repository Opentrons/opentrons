import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { Banner } from '../Banner'

const render = (props: React.ComponentProps<typeof Banner>) => {
  return renderWithProviders(<Banner {...props} />)[0]
}

describe('HeaterShakerBanner', () => {
  let props: React.ComponentProps<typeof Banner>
  beforeEach(() => {
    props = {
      title: 'TITLE',
    }
  })

  it('should render correct text when subtitle is not null', () => {
    const { getByText, getByLabelText } = render(props)
    getByText('TITLE')
    getByLabelText('information_icon')
  })

  it('should render correct text when subtitle null', () => {
    props = {
      title: 'TITLE',
    }
    const { getByText } = render(props)
    getByText('TITLE')
  })
})
