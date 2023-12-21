import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import {
  useTrackEvent,
  ANALYTICS_IMPORT_PROTOCOL_TO_APP,
} from '../../../redux/analytics'
import { ProtocolUploadInput } from '../ProtocolUploadInput'

jest.mock('../../../redux/analytics')

const mockUseTrackEvent = useTrackEvent as jest.Mock<typeof useTrackEvent>

describe('ProtocolUploadInput', () => {
  let onUpload: jest.MockedFunction<() => {}>
  let trackEvent: jest.MockedFunction<any>
  const render = () => {
    return renderWithProviders(
      <BrowserRouter>
        <ProtocolUploadInput onUpload={onUpload} />
      </BrowserRouter>,
      {
        i18nInstance: i18n,
      }
    )
  }

  beforeEach(() => {
    onUpload = jest.fn()
    trackEvent = jest.fn()
    mockUseTrackEvent.mockReturnValue(trackEvent)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct contents for empty state', () => {
    render()

    screen.getByRole('button', { name: 'Upload' })
    screen.getByText(/Drag and drop or/i)
    screen.getByText(/your files/i)
    screen.getByText(
      'Valid file types: Python files (.py) or Protocol Designer files (.json)'
    )
    screen.getByRole('button', { name: 'browse' })
  })

  it('opens file select on button click', () => {
    render()
    const button = screen.getByRole('button', { name: 'Upload' })
    const input = screen.getByTestId('file_input')
    input.click = jest.fn()
    fireEvent.click(button)
    expect(input.click).toHaveBeenCalled()
  })
  it('calls onUpload callback on choose file and trigger analytics event', () => {
    render()
    const input = screen.getByTestId('file_input')
    fireEvent.change(input, {
      target: { files: [{ path: 'dummyFile', name: 'dummyName' }] },
    })
    expect(onUpload).toHaveBeenCalled()
    expect(trackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_IMPORT_PROTOCOL_TO_APP,
      properties: { protocolFileName: 'dummyName' },
    })
  })
})
