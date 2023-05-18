import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { ConfirmRobotName } from '../ConfirmRobotName'

const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (props: React.ComponentProps<typeof ConfirmRobotName>) => {
  return renderWithProviders(
    <MemoryRouter>
      <ConfirmRobotName {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ConfirmRobotName', () => {
  let props: React.ComponentProps<typeof ConfirmRobotName>
  beforeEach(() => {
    props = {
      robotName: 'otie',
    }
  })

  it('should render text, an image and a button', () => {
    const [{ getByText }] = render(props)
    getByText('otie, love it!')
    getByText('Your robot is ready to go.')
    getByText('Finish setup')
  })

  it('when tapping a button, call a mock function', () => {
    const [{ getByText }] = render(props)
    const button = getByText('Finish setup')
    button.click()
    expect(mockPush).toBeCalledWith('/dashboard')
  })
})
