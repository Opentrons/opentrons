import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'

import { renderWithProviders, useLongPress } from '@opentrons/components'
import { HostConfig } from '@opentrons/api-client'
import { useCreateRunMutation, useHost } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { LongPressModal } from '../LongPressModal'

import type { UseLongPressResult } from '@opentrons/components'

const MOCK_HOST_CONFIG = {} as HostConfig
const mockCreateRun = jest.fn((id: string) => {})
const mockUseCreateRunMutation = useCreateRunMutation as jest.MockedFunction<
  typeof useCreateRunMutation
>
const mockuseHost = useHost as jest.MockedFunction<typeof useHost>
const mockFunc = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
  }
})
jest.mock('@opentrons/api-client')
jest.mock('@opentrons/react-api-client')

const render = (longPress: UseLongPressResult) => {
  return renderWithProviders(
    <MemoryRouter>
      <LongPressModal
        longpress={longPress}
        protocolId={'mockProtocol1'}
        setShowDeleteConfirmationModal={mockFunc}
      />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Long Press Modal', () => {
  beforeEach(() => {
    when(mockuseHost).calledWith().mockReturnValue(MOCK_HOST_CONFIG)
  })
  afterEach(() => {
    resetAllWhenMocks()
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
    button.click()
    expect(mockFunc).toHaveBeenCalled()
  })

  it('should launch protocol run when clicking run protocol button', () => {
    mockUseCreateRunMutation.mockReturnValue({
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
