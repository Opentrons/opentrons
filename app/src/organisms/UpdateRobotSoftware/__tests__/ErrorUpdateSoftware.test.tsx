import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { startBuildrootUpdate } from '../../../redux/buildroot'
import { ErrorUpdateSoftware } from '../ErrorUpdateSoftware'

const mockPush = jest.fn()
jest.mock('../../../redux/buildroot')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (props: React.ComponentProps<typeof ErrorUpdateSoftware>) => {
  return renderWithProviders(<ErrorUpdateSoftware {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ErrorUpdateSoftware', () => {
  let props: React.ComponentProps<typeof ErrorUpdateSoftware>

  beforeEach(() => {
    props = {
      errorMessage: 'mock error message',
      robotName: 'mockRobot',
    }
  })

  it('should render text and buttons', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('Software update error')
    getByText('mock error message')
    getByRole('button', { name: 'Proceed without updating' })
    getByRole('button', { name: 'Try again' })
  })

  it('call mockPush when tapping Proceed without updating', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Proceed without updating' })
    fireEvent.click(button)
    expect(mockPush).toBeCalledWith('/robot-settings/rename-robot')
  })

  it('call mock function when tapping Try again', () => {
    const [{ getByRole }, store] = render(props)
    const button = getByRole('button', { name: 'Try again' })
    fireEvent.click(button)
    expect(store.dispatch).toHaveBeenCalledWith(
      startBuildrootUpdate(props.robotName)
    )
  })
})
