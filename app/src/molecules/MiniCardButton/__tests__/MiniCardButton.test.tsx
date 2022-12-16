import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { MiniCardButton } from '..'

const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (props: React.ComponentProps<typeof MiniCardButton>) => {
  return renderWithProviders(<MiniCardButton {...props} />)
}

describe('MiniCardButton', () => {
  let props: React.ComponentProps<typeof MiniCardButton>

  beforeEach(() => {
    props = {
      iconName: 'play',
      cardName: 'mockMiniCard',
      destinationPath: '/mockPath',
    }
  })

  it('should render text and icon', () => {
    const [{ getByText, getByTestId }] = render(props)
    getByText('mockMiniCard')
    getByTestId('miniCardButton_play')
  })

  it('should call mock function when tapping MiniCardButton', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button')
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/mockPath')
  })
})
