import { useDispatch } from 'react-redux'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useHost } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
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

const render = () => {
  return renderWithProviders(<LaunchLivestreamBtn runId="MOCK-RUN-ID" />, {
    i18nInstance: i18n,
  })
}

describe('LaunchLivestreamBtn', () => {
  let mockDispatch: Mock

  beforeEach(() => {
    mockDispatch = vi.fn()
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(useHost).mockReturnValue({
      robotName: 'test-robot',
      hostname: 'test-hostname',
    })
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
        runId: 'MOCK-RUN-ID',
      },
      meta: { shell: true },
    })
  })
})
