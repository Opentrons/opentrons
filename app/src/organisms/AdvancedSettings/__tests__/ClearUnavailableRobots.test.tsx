import * as React from 'react'
import { screen, fireEvent } from '@testing-library/react'

import {
  renderWithProviders,
  useConditionalConfirm,
} from '@opentrons/components'
import { i18n } from '../../../i18n'
import {
  getReachableRobots,
  getUnreachableRobots,
} from '../../../redux/discovery'
import {
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { ClearUnavailableRobots } from '../ClearUnavailableRobots'

jest.mock('@opentrons/components/src/hooks')
jest.mock('../../../redux/discovery')

const mockGetUnreachableRobots = getUnreachableRobots as jest.MockedFunction<
  typeof getUnreachableRobots
>
const mockGetReachableRobots = getReachableRobots as jest.MockedFunction<
  typeof getReachableRobots
>
const mockUseConditionalConfirm = useConditionalConfirm as jest.MockedFunction<
  typeof useConditionalConfirm
>

const render = () => {
  return renderWithProviders(<ClearUnavailableRobots />, {
    i18nInstance: i18n,
  })
}

const mockConfirm = jest.fn()
const mockCancel = jest.fn()

describe('ClearUnavailableRobots', () => {
  let props: React.ComponentProps<typeof ClearUnavailableRobots>

  beforeEach(() => {
    mockGetUnreachableRobots.mockReturnValue([mockUnreachableRobot])
    mockGetReachableRobots.mockReturnValue([mockReachableRobot])
    mockUseConditionalConfirm.mockReturnValue({
      confirm: mockConfirm,
      showConfirmation: true,
      cancel: mockCancel,
    })
  })

  afterEach(() => {})

  it('should render text and button', () => {
    render()
    screen.getByText('Clear Unavailable Robots')
    screen.getByText(
      'Clear the list of unavailable robots on the Devices page. This action cannot be undone.'
    )
    screen.getByRole('button', {
      name: 'Clear unavailable robots list',
    })
  })

  it('should render modal when clicking clear button', () => {
    render()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Clear unavailable robots list',
      })
    )
    screen.getByText('Clear unavailable robots?')
    screen.getByText(
      'Clearing the list of unavailable robots on the Devices page cannot be undone.'
    )
    screen.getByRole('button', {
      name: 'cancel',
    })
    screen.getByRole('button', {
      name: 'Clear unavailable robots',
    })
  })

  it('should call mock confirmation when clicking clear button', () => {
    render()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Clear unavailable robots list',
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Clear unavailable robots',
      })
    )
    expect(mockConfirm).toHaveBeenCalled()
  })

  it('should call mock cancel when clicking cancel button', () => {
    render()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Clear unavailable robots list',
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'cancel',
      })
    )
    expect(mockCancel).toHaveBeenCalled()
  })
})
