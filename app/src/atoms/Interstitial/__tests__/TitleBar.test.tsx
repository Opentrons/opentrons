import { InterstitialTitleBar } from '../InterstitiallTitleBar'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import * as React from 'react'

const render = (props: React.ComponentProps<typeof InterstitialTitleBar>) => {
  return renderWithProviders(<InterstitialTitleBar {...props} />)[0]
}

describe('TitleBar', () => {
  let props: React.ComponentProps<typeof InterstitialTitleBar>
  const EXIT = { title: 'EXIT', onClick: jest.fn(), children: 'EXIT' }
  beforeEach(() => {
    props = {
      title: 'TITLE',
      exit: EXIT,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render everything when back is defined and clicks button', () => {
    const { getByText, getByLabelText, getByRole } = render(props)
    getByText('TITLE')
    getByLabelText('ot-logo')
    getByLabelText('close')
    getByText('EXIT')
    const button = getByRole('button', { name: /close_btn/i })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(EXIT.onClick).toBeCalled()
  })
})
