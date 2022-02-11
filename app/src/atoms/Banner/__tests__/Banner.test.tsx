import * as React from 'react'
import { fireEvent } from '@testing-library/react'
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
      body: 'BODY',
      btnText: 'btnText',
      subtitle: 'SUBTITLE',
      onClick: jest.fn(),
    }
  })

  it('should render correct text', () => {
    const { getByText } = render(props)
    getByText('TITLE')
    getByText('BODY')
    getByText('btnText')
    getByText('SUBTITLE')
  })

  it('should render button and it is clickable', () => {
    const { getByRole } = render(props)
    const button = getByRole('button', {
      name: 'btnText',
    })
    fireEvent.click(button)
    expect(button).toBeEnabled()
  })
})
