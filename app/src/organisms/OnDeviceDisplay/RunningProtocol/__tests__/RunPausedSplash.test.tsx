import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { COLORS } from '@opentrons/components'

import { RunPausedSplash } from '../RunPausedSplash'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'

const render = (props: React.ComponentProps<typeof RunPausedSplash>) => {
  return renderWithProviders(
    <MemoryRouter>
      <RunPausedSplash {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const MOCK_PROTOCOL_NAME = 'MOCK_PROTOCOL'

describe('ConfirmCancelRunModal', () => {
  let props: React.ComponentProps<typeof RunPausedSplash>
  const mockOnClose = vi.fn()

  beforeEach(() => {
    props = {
      onClose: mockOnClose,
      protocolName: MOCK_PROTOCOL_NAME,
      errorType: '',
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render a generic paused screen if there is no errorType', () => {
    render(props)
    expect(screen.getByText('Run paused')).toBeInTheDocument()
    expect(screen.getByText(MOCK_PROTOCOL_NAME))
    expect(screen.getByRole('button')).toHaveStyle({
      'background-color': COLORS.grey50,
    })
    fireEvent.click(screen.getByRole('button'))
    expect(mockOnClose).toHaveBeenCalled()
  })
})
