import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react'
import {
  getPipetteSettings,
  pipetteSettingsResponseFixture,
} from '@opentrons/api-client'
import { useHost } from '../../api'
import { usePipetteSettingsQuery } from '..'

import type {
  HostConfig,
  PipetteSettings,
  Response,
} from '@opentrons/api-client'
import type { UsePipetteSettingsQueryOptions } from '../usePipetteSettingsQuery'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetPipetteSettings = getPipetteSettings as jest.MockedFunction<
  typeof getPipetteSettings
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('usePipetteSettingsQuery hook', () => {
  let wrapper: React.FunctionComponent<{children: React.ReactNode} & UsePipetteSettingsQueryOptions>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{children: React.ReactNode} & UsePipetteSettingsQueryOptions> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data if no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(usePipetteSettingsQuery, { wrapper })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the getPipettes request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetPipetteSettings)
      .calledWith(HOST_CONFIG)
      .mockRejectedValue('oh no')

    const { result } = renderHook(usePipetteSettingsQuery, { wrapper })
    expect(result.current.data).toBeUndefined()
  })

  it('should return all current attached pipettes', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetPipetteSettings)
      .calledWith(HOST_CONFIG)
      .mockResolvedValue({
        data: pipetteSettingsResponseFixture as any,
      } as Response<PipetteSettings>)

    const { result, waitFor } = renderHook(usePipetteSettingsQuery, {
      wrapper,
    })

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(pipetteSettingsResponseFixture)
  })
})
