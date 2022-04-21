import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
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
      'Choose a name for your robot. You can use letters, numbers, spaces, special characters (!?$*) and emojis.'
    )
    getByText('Robot Name')
    getByText('35 characters max')
    getByRole('textbox')
    const renameButton = getByRole('button', { name: 'Rename robot' })
    expect(renameButton).toBeInTheDocument()
    expect(renameButton).toBeDisabled()
  })

  it('should be disabled false when a user typing allowed characters', () => {
    const [{ getByRole }] = render()
    const input = getByRole('textbox')
    fireEvent.change(input, { target: { value: 'mockInput' } })
    expect(input).toHaveValue('mockInput')
    const renameButton = getByRole('button', { name: 'Rename robot' })
    expect(renameButton).not.toBeDisabled()
  })

  it('should keep disabled when a user types invalid character/characters', () => {
    const [{ getByRole }] = render()
    const input = getByRole('textbox')
    fireEvent.change(input, { target: { value: '@@@@mockInput' } })
    expect(input).toHaveValue('@@@@mockInput')
    const renameButton = getByRole('button', { name: 'Rename robot' })
    expect(renameButton).toBeDisabled()
  })

  it('should keep disabled when a user types more than 36 characters', () => {
    const [{ getByRole }] = render()
    const input = getByRole('textbox')
    fireEvent.change(input, {
      target: { value: 'This is 35 characters This is a mock' },
    })
    expect(input).toHaveValue('This is 35 characters This is a mock')
    const renameButton = getByRole('button', { name: 'Rename robot' })
    expect(renameButton).toBeDisabled()
  })

  it('should close the slideout when a user change the name successfully', () => {})
})
