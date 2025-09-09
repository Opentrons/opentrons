import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { ProtocolRunCamera } from '..'
import { LaunchLivestreamBtn } from '../LaunchLivestreamBtn'

vi.mock('../LaunchLivestreamBtn')

const render = () => {
  return renderWithProviders(<ProtocolRunCamera />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolRunCamera', () => {
  beforeEach(() => {
    vi.mocked(LaunchLivestreamBtn).mockReturnValue(
      <div>MOCK_LIVE_STREAM_BTN</div>
    )
  })

  it('renders camera text', () => {
    render()

    screen.getByText('Camera')
  })

  it('renders LaunchLivestreamBtn component', () => {
    render()

    screen.getByText('MOCK_LIVE_STREAM_BTN')
  })

  it('renders chip with enabled status and text', () => {
    render()

    screen.getByTestId('Chip_success')
    screen.getByText('Enabled')
  })
})
