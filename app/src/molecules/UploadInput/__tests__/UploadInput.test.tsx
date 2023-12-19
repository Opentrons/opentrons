import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { UploadInput } from '..'

describe('UploadInput', () => {
  let onUpload: jest.MockedFunction<() => {}>

  beforeEach(() => {
    onUpload = jest.fn()
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct contents for empty state', () => {
    renderWithProviders(
      <BrowserRouter>
        <UploadInput onUpload={onUpload} />
      </BrowserRouter>,
      {
        i18nInstance: i18n,
      }
    )

    expect(screen.getByRole('button', { name: 'Upload' })).toBeTruthy()
  })

  it('opens file select on button click', () => {
    renderWithProviders(
      <BrowserRouter>
        <UploadInput onUpload={onUpload} />
      </BrowserRouter>,
      {
        i18nInstance: i18n,
      }
    )
    const button = screen.getByRole('button', { name: 'Upload' })
    const input = screen.getByTestId('file_input')
    input.click = jest.fn()
    fireEvent.click(button)
    expect(input.click).toHaveBeenCalled()
  })
  it('calls create session on choose file', () => {
    renderWithProviders(
      <BrowserRouter>
        <UploadInput onUpload={onUpload} />
      </BrowserRouter>,
      {
        i18nInstance: i18n,
      }
    )
    const input = screen.getByTestId('file_input')
    fireEvent.change(input, { target: { files: ['dummyFile'] } })
    expect(onUpload).toHaveBeenCalledWith('dummyFile')
  })
})
