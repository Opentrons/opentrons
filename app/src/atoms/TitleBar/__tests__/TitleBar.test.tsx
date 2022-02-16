import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { TitleBar } from '..'

const render = (props: React.ComponentProps<typeof TitleBar>) => {
  return renderWithProviders(<TitleBar {...props} />)[0]
}

describe('TitleBar', () => {
  let props: React.ComponentProps<typeof TitleBar>
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
