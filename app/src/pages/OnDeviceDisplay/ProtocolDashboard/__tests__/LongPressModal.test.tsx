import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'

import { renderWithProviders, useLongPress } from '@opentrons/components'
import { useCreateRunMutation } from '@opentrons/react-api-client'

import { i18n } from '../../../../i18n'
import { LongPressModal } from '../LongPressModal'

import type { UseLongPressResult } from '@opentrons/components'

const mockCreateRun = jest.fn((id: string) => {})
const mockUseCreateRunMutation = useCreateRunMutation as jest.MockedFunction<
  typeof useCreateRunMutation
>

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
  }
})
jest.mock('@opentrons/react-api-client')

const render = (longPress: UseLongPressResult) => {
  return renderWithProviders(
    <MemoryRouter>
      <LongPressModal longpress={longPress} protocolId={'mockProtocol1'} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Long Press Modal', () => {
  it('should display the three options', () => {
    const { result } = renderHook(() => useLongPress())
    result.current.isLongPressed = true
    const [{ getByText }] = render(result.current)
    getByText('Run protocol')
    getByText('Pin protocol')
    getByText('Delete protocol')
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
