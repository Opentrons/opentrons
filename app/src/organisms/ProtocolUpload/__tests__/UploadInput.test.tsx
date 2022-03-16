import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { UploadInput } from '../UploadInput'
import { LastRun } from '../LastRun'

jest.mock('../LastRun')

const mockLastRun = LastRun as jest.MockedFunction<typeof LastRun>

describe('UploadInput', () => {
  let onUpload: jest.MockedFunction<() => {}>
  let render: () => ReturnType<typeof renderWithProviders>[0]

  beforeEach(() => {
    mockLastRun.mockReturnValue(<div>MOCK LAST RUN</div>)
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
    const { getByRole, getByText } = render()

    expect(getByRole('button', { name: 'Choose File...' })).toBeTruthy()
    expect(
      getByRole('button', { name: 'Drag and drop protocol file here' })
    ).toBeTruthy()
    expect(getByRole('complementary')).toHaveTextContent(
      /Don't have a protocol yet\?/i
    )
    getByText('MOCK LAST RUN')
    expect(
      getByRole('link', { name: 'Launch Opentrons Protocol Library' })
    ).toBeTruthy()
    expect(
      getByRole('link', { name: 'Launch Opentrons Protocol Designer' })
    ).toBeTruthy()
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
    expect(onUpload).toHaveBeenCalledWith('dummyFile')
  })
})
