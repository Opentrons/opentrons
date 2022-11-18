import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CardButton } from '../CardButton'

const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (props: React.ComponentProps<typeof CardButton>) => {
  return renderWithProviders(
    <MemoryRouter>
      <CardButton {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('CardButton', () => {
  let props: React.ComponentProps<typeof CardButton>

  beforeEach(() => {
    props = {
      cardWidth: '19rem',
      cardHeight: '21rem',
      title: 'wifi',
      iconName: 'wifi',
      description: 'connection_description',
      distPath: 'mockPath',
    }
  })

  it('should render text and icon', () => {
    const [{ getByText, getByTestId }] = render(props)
    getByText('Wi-Fi')
    getByText('Find a network in your lab or enter your own.')
    expect(getByTestId('cardButton_icon_wifi')).toBeInTheDocument()
  })

  it('should call mock function with path when tapping a card', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button')
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/mockPath')
  })
})
