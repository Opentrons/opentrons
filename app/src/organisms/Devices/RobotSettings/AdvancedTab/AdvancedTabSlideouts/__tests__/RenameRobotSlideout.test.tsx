import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../../i18n'
import {
  useTrackEvent,
  ANALYTICS_RENAME_ROBOT,
} from '../../../../../../redux/analytics'
import {
  getConnectableRobots,
  getReachableRobots,
} from '../../../../../../redux/discovery'
import {
  mockConnectableRobot,
  mockReachableRobot,
} from '../../../../../../redux/discovery/__fixtures__'

import { RenameRobotSlideout } from '../RenameRobotSlideout'
import { useIsOT3 } from '../../../../hooks'

jest.mock('../../../../../../redux/discovery/selectors')
jest.mock('../../../../../../redux/analytics')
jest.mock('../../../../hooks')

const mockGetConnectableRobots = getConnectableRobots as jest.MockedFunction<
  typeof getConnectableRobots
>
const mockGetReachableRobots = getReachableRobots as jest.MockedFunction<
  typeof getReachableRobots
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockUseIsOT3 = useIsOT3 as jest.MockedFunction<typeof useIsOT3>

const mockOnCloseClick = jest.fn()
let mockTrackEvent: jest.Mock

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RenameRobotSlideout
        isExpanded={true}
        onCloseClick={mockOnCloseClick}
        robotName="otie"
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings RenameRobotSlideout', () => {
  beforeEach(() => {
    mockTrackEvent = jest.fn()
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    mockConnectableRobot.name = 'connectableOtie'
    mockReachableRobot.name = 'reachableOtie'
    mockGetConnectableRobots.mockReturnValue([mockConnectableRobot])
    mockGetReachableRobots.mockReturnValue([mockReachableRobot])
    mockUseIsOT3.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description, label, input, and button', () => {
    const [{ getByText, getByRole }] = render()

    getByText('Rename Robot')
    getByText(
      'To ensure reliable renaming of your robot, please connect to it via USB.'
    )
    getByText(
      'Please enter 17 characters max using valid inputs: letters and numbers.'
    )
    getByText('Robot Name')
    getByText('17 characters max')
    getByRole('textbox')
    const renameButton = getByRole('button', { name: 'Rename robot' })
    expect(renameButton).toBeInTheDocument()
    expect(renameButton).toBeDisabled()
  })

  it('should render title, description, label, input, and button for flex', () => {
    mockUseIsOT3.mockReturnValue(true)
    const [{ getByText, getByRole, queryByText }] = render()
    getByText('Rename Robot')
    expect(
      queryByText(
        'To ensure reliable renaming of your robot, please connect to it via USB.'
      )
    ).not.toBeInTheDocument()
    getByText(
      'Please enter 17 characters max using valid inputs: letters and numbers.'
    )
    getByText('Robot Name')
    getByText('17 characters max')
    getByRole('textbox')
    const renameButton = getByRole('button', { name: 'Rename robot' })
    expect(renameButton).toBeInTheDocument()
    expect(renameButton).toBeDisabled()
  })

  it('should be disabled false when a user typing allowed characters', async () => {
    const [{ getByRole }] = render()
    const input = getByRole('textbox')
    fireEvent.change(input, { target: { value: 'mockInput' } })

    await waitFor(() => {
      expect(input).toHaveValue('mockInput')
      const renameButton = getByRole('button', { name: 'Rename robot' })
      expect(renameButton).not.toBeDisabled()
      fireEvent.click(renameButton)
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: ANALYTICS_RENAME_ROBOT,
        properties: { newRobotName: 'mockInput', previousRobotName: 'otie' },
      })
    })
  })

  it('button should be disabled and render the error message when a user types invalid character/characters', async () => {
    const [{ getByRole, findByText }] = render()
    const input = getByRole('textbox')
    fireEvent.change(input, { target: { value: 'mockInput@@@' } })
    expect(input).toHaveValue('mockInput@@@')
    const renameButton = getByRole('button', { name: 'Rename robot' })
    const error = await findByText(
      'Oops! Robot name must follow the character count and limitations'
    )
    await waitFor(() => {
      expect(renameButton).toBeDisabled()
      expect(error).toBeInTheDocument()
    })
  })

  it('button should be disabled and render the error message when a user types more than 17 characters', async () => {
    const [{ getByRole, findByText }] = render()
    const input = getByRole('textbox')
    fireEvent.change(input, {
      target: { value: 'aaaaaaaaaaaaaaaaaa' },
    })
    expect(input).toHaveValue('aaaaaaaaaaaaaaaaaa')
    const renameButton = getByRole('button', { name: 'Rename robot' })
    const error = await findByText(
      'Oops! Robot name must follow the character count and limitations'
    )
    await waitFor(() => {
      expect(renameButton).toBeDisabled()
      expect(error).toBeInTheDocument()
    })
  })

  it('button should be disabled and render the error message when a user tries to use space', async () => {
    const [{ getByRole, findByText }] = render()
    const input = getByRole('textbox')
    fireEvent.change(input, {
      target: { value: 'Hello world123' },
    })
    expect(input).toHaveValue('Hello world123')
    const renameButton = getByRole('button', { name: 'Rename robot' })
    const error = await findByText(
      'Oops! Robot name must follow the character count and limitations'
    )
    await waitFor(() => {
      expect(renameButton).toBeDisabled()
      expect(error).toBeInTheDocument()
    })
  })

  it('button should be disabled and render the error message when a user tries to use space as the first letter', async () => {
    const [{ getByRole, findByText }] = render()
    const input = getByRole('textbox')
    fireEvent.change(input, {
      target: { value: ' ' },
    })
    expect(input).toHaveValue(' ')
    const renameButton = getByRole('button', { name: 'Rename robot' })
    const error = await findByText(
      'Oops! Robot name must follow the character count and limitations'
    )
    await waitFor(() => {
      expect(renameButton).toBeDisabled()
      expect(error).toBeInTheDocument()
    })
  })

  it('button should be disabled and render the error message when a user rename a robot to a name that used by a connectable robot', async () => {
    const [{ getByRole, findByText }] = render()
    const input = getByRole('textbox')
    fireEvent.change(input, {
      target: { value: 'connectableOtie' },
    })
    expect(input).toHaveValue('connectableOtie')
    const renameButton = getByRole('button', { name: 'Rename robot' })
    const error = await findByText(
      'Oops! Name is already in use. Choose a different name.'
    )
    await waitFor(() => {
      expect(renameButton).toBeDisabled()
      expect(error).toBeInTheDocument()
    })
  })
  it('button should be disabled and render the error message when a user rename a robot to a name that used by a reachable robot', async () => {
    const [{ getByRole, findByText }] = render()
    const input = getByRole('textbox')
    fireEvent.change(input, {
      target: { value: 'reachableOtie' },
    })
    expect(input).toHaveValue('reachableOtie')
    const renameButton = getByRole('button', { name: 'Rename robot' })
    const error = await findByText(
      'Oops! Name is already in use. Choose a different name.'
    )
    await waitFor(() => {
      expect(renameButton).toBeDisabled()
      expect(error).toBeInTheDocument()
    })
  })
  // TODO: kj   The following test case will be tested in the future
  // it('should close the slideout when a user change the name successfully', () => {
  //   const [{ getByRole }, store] = render()
  //   expect(store.dispatch).toHaveBeenCalledWith(removeRobot('otie'))
  //   const input = getByRole('textbox')
  //   fireEvent.change(input, { target: { value: 'newMockInput' } })
  //   const renameButton = getByRole('button', { name: 'Rename robot' })
  //   fireEvent.click(renameButton)
  //   expect(store.getState().router.location.pathname).toBe(
  //     '/devices/newMockInput/robot-settings'
  //   )
  // })
})
