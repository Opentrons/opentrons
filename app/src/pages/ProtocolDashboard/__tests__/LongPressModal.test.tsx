import * as React from 'react'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { when } from 'vitest-when'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, renderHook } from '@testing-library/react'

import { useLongPress } from '@opentrons/components'
import { HostConfig } from '@opentrons/api-client'
import { useCreateRunMutation, useHost } from '@opentrons/react-api-client'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { LongPressModal } from '../LongPressModal'

import type { UseLongPressResult } from '@opentrons/components'

const MOCK_HOST_CONFIG = {} as HostConfig
const mockCreateRun = vi.fn((id: string) => {})
const mockFunc = vi.fn()
const mockSetTargetProtocolId = vi.fn()

vi.mock('@opentrons/api-client')
vi.mock('@opentrons/react-api-client')

const render = (longPress: UseLongPressResult) => {
  return renderWithProviders(
    <MemoryRouter>
      <LongPressModal
        longpress={longPress}
        protocolId={'mockProtocol1'}
        setShowDeleteConfirmationModal={mockFunc}
        setTargetProtocolId={mockSetTargetProtocolId}
      />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Long Press Modal', () => {
  beforeEach(() => {
    when(vi.mocked(useHost)).calledWith().thenReturn(MOCK_HOST_CONFIG)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should display the three options', () => {
    const { result } = renderHook(() => useLongPress())
    result.current.isLongPressed = true
    const [{ getByText }] = render(result.current)
    getByText('Run protocol')
    getByText('Pin protocol')
    getByText('Delete protocol')
  })

  it('should call mock function when tapping delete protocol', () => {
    const { result } = renderHook(() => useLongPress())
    result.current.isLongPressed = true
    const [{ getByText }] = render(result.current)
    const button = getByText('Delete protocol')
    fireEvent.click(button)
    expect(mockSetTargetProtocolId).toHaveBeenCalledWith('mockProtocol1')
    expect(mockFunc).toHaveBeenCalled()
  })

  it('should launch protocol run when clicking run protocol button', () => {
    vi.mocked(useCreateRunMutation).mockReturnValue({
      createRun: mockCreateRun,
    } as any)

    const { result } = renderHook(() => useLongPress())
    result.current.isLongPressed = true
    const [{ getByText }] = render(result.current)
    const runButton = getByText('Run protocol')
    fireEvent.click(runButton)
    expect(mockCreateRun).toHaveBeenCalled()
  })
})
