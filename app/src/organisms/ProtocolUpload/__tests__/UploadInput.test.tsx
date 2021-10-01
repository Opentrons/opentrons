import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { UploadInput } from '../UploadInput'

describe('UploadInput', () => {
  let render: () => ReturnType<typeof renderWithProviders>
  let handleUpload: jest.MockedFunction<
    React.ComponentProps<typeof UploadInput>['onUpload']
  >

  beforeEach(() => {
    handleUpload = jest.fn()
    render = () => {
      return renderWithProviders(<UploadInput onUpload={handleUpload} />, {
        i18nInstance: i18n,
      })
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct contents for empty state', () => {
    const { getByRole } = render()

    expect(getByRole('heading')).toHaveTextContent(
      /Open a protocol to get started/i
    )
    expect(getByRole('button', { name: 'Choose File...' })).toBeTruthy()
    expect(
      getByRole('button', { name: 'Drag and drop protocol file here' })
    ).toBeTruthy()
    expect(getByRole('complementary')).toHaveTextContent(
      /Don't have a protocol yet\?/i
    )
    expect(
      getByRole('link', { name: 'Browse Our Protocol Library' })
    ).toBeTruthy()
    expect(getByRole('link', { name: 'Launch Protocol Designer' })).toBeTruthy()
  })

  it('opens file select on button click', () => {
    const { getByRole, getByTestId } = render()
    const button = getByRole('button', { name: 'Choose File...' })
    const input = getByTestId('file_input')
    input.click = jest.fn()
    fireEvent.click(button)
    expect(input.click).toHaveBeenCalled()
  })
  it('calls create session on choose file', () => {
    const { getByTestId } = render()
    const input = getByTestId('file_input')
    fireEvent.change(input, { target: { files: ['dummyFile'] } })
    expect(handleUpload).toHaveBeenCalledWith('dummyFile')
  })
})
