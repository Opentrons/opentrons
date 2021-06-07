import * as React from 'react'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components/__utils__'

import { i18n } from '../../../i18n'
import { UploadInput } from '../UploadInput'

describe('UploadInput', () => {
  let render: () => ReturnType<typeof renderWithProviders>
  let createSession: jest.MockedFunction<
    React.ComponentProps<typeof UploadInput>['createSession']
  >

  beforeEach(() => {
    createSession = jest.fn()
    render = () => {
      return renderWithProviders(
        <UploadInput createSession={createSession} />,
        { i18nInstance: i18n }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct text for empty state', () => {
    render()

    expect(screen.getByText('Open a protocol to get started')).toBeTruthy()
    expect(screen.getByText('Choose File...')).toBeTruthy()
    expect(screen.getByText('Drag and drop protocol file here')).toBeTruthy()
    expect(screen.getByText("Don't have a protocol yet?")).toBeTruthy()
    expect(screen.getByText('Browse Our Protocol Library')).toBeTruthy()
    expect(screen.getByText('Launch Protocol Designer')).toBeTruthy()
  })

  it('calls createSession on button click', () => {
    const { getByRole, getByTestId } = render()
    const button = getByRole('button', { name: 'Choose File...' })
    const input = getByTestId('file_input')
    input.click = jest.fn()
    fireEvent.click(button)
    expect(input.click).toHaveBeenCalled()
  })
})
