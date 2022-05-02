import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../../i18n'

import { RenameRobotSlideout } from '../RenameRobotSlideout'

const mockOnCloseClick = jest.fn()
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
  beforeEach(() => {})

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description, label, input, and button', () => {
    const [{ getByText, getByRole }] = render()

    getByText('Rename Robot')
    getByText(
      'Please enter 35 characters max using valid inputs: letters, numbers, spaces and these special characters: !?$*’-_.'
    )
    getByText('Robot Name')
    getByText('35 characters max')
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
    })
  })

  it('button should be disabled and render the error message when a user types invalid character/characters', async () => {
    const [{ getByRole, findByText }] = render()
    const input = getByRole('textbox')
    fireEvent.change(input, { target: { value: 'mockInput@@@' } })
    expect(input).toHaveValue('mockInput@@@')
    const renameButton = getByRole('button', { name: 'Rename robot' })
    const error = await findByText(
      'Please enter 35 characters max using valid inputs: letters, numbers, spaces and these special characters: !?$*’-_.'
    )
    await waitFor(() => {
      expect(renameButton).toBeDisabled()
      expect(error).toBeInTheDocument()
    })
  })

  it('button should be disabled and render the error message when a user types more than 36 characters', async () => {
    const [{ getByRole, findByText }] = render()
    const input = getByRole('textbox')
    fireEvent.change(input, {
      target: { value: 'This is more than 35 characters This is a mock' },
    })
    expect(input).toHaveValue('This is more than 35 characters This is a mock')
    const renameButton = getByRole('button', { name: 'Rename robot' })
    const error = await findByText(
      'Please enter 35 characters max using valid inputs: letters, numbers, spaces and these special characters: !?$*’-_.'
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
      'Please enter 35 characters max using valid inputs: letters, numbers, spaces and these special characters: !?$*’-_.'
    )
    await waitFor(() => {
      expect(renameButton).toBeDisabled()
      expect(error).toBeInTheDocument()
    })
  })
  // TODO: The following test case will be tested in the future
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
