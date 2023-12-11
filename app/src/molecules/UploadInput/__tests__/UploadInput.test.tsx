import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { UploadInput } from '..'

describe('UploadInput', () => {
  let onUpload: jest.MockedFunction<() => {}>
  let render: () => ReturnType<typeof renderWithProviders>[0]

  beforeEach(() => {
    onUpload = jest.fn()
    render = () => {
      return renderWithProviders(
        <BrowserRouter>
          <UploadInput onUpload={onUpload} />
        </BrowserRouter>,
        {
          i18nInstance: i18n,
        }
      )[0]
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct contents for empty state', () => {
    const { getByRole } = render()

    expect(getByRole('button', { name: 'Upload' })).toBeTruthy()
  })

  it('opens file select on button click', () => {
    const { getByRole, getByTestId } = render()
    const button = getByRole('button', { name: 'Upload' })
    const input = getByTestId('file_input')
    input.click = jest.fn()
    fireEvent.click(button)
    expect(input.click).toHaveBeenCalled()
  })
  it('calls create session on choose file', () => {
    const { getByTestId } = render()
    const input = getByTestId('file_input')
    fireEvent.change(input, { target: { files: ['dummyFile'] } })
    expect(onUpload).toHaveBeenCalledWith('dummyFile')
  })
})
