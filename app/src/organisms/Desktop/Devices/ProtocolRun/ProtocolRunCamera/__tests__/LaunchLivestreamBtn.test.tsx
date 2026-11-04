import { useDispatch } from 'react-redux'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useHost } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useToaster } from '/app/organisms/ToasterOven'
import { OPENTRONS_USB } from '/app/redux/discovery'
import { CAMERA_STREAM_OPEN } from '/app/redux/shell'

import { LaunchLivestreamBtn } from '../LaunchLivestreamBtn'

import type { Mock } from 'vitest'

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux')
  return {
    ...actual,
    useDispatch: vi.fn(),
  }
})
vi.mock('@opentrons/react-api-client')
vi.mock('/app/organisms/ToasterOven')

const render = () => {
  return renderWithProviders(
    <LaunchLivestreamBtn runId="MOCK-RUN-ID" robotType="OT-3 Standard" />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('LaunchLivestreamBtn', () => {
  let mockDispatch: Mock
  let mockMakeSnackbar: Mock

  beforeEach(() => {
    mockDispatch = vi.fn()
    mockMakeSnackbar = vi.fn()
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(useToaster).mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      makeToast: vi.fn(),
      eatToast: vi.fn(),
    })
    vi.mocked(useHost).mockReturnValue({
      robotName: 'test-robot',
      hostname: 'test-hostname',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders button text', () => {
    render()

    screen.getByText('Live camera')
  })

  it('dispatches a camera stream open action when clicked', () => {
    render()

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockDispatch).toHaveBeenCalledWith({
      type: CAMERA_STREAM_OPEN,
      payload: {
        hostname: 'test-hostname',
        robotName: 'test-robot',
        windowTitle: 'Opentrons test-robot Live Camera',
      },
      meta: { shell: true },
    })
    expect(mockMakeSnackbar).not.toHaveBeenCalled()
  })

  it('shows a snackbar and keeps the button enabled when connected over USB', () => {
    vi.mocked(useHost).mockReturnValue({
      robotName: 'test-robot',
      hostname: OPENTRONS_USB,
    })
    render()

    const button = screen.getByRole('button', { name: /live camera/i })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    expect(mockMakeSnackbar).toHaveBeenCalledWith(
      'Connect to Wi-Fi or Ethernet to access live camera'
    )
    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
