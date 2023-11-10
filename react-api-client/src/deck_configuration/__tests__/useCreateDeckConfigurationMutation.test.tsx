import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'

import { createDeckConfiguration } from '@opentrons/api-client'
// import {
//   TRASH_BIN_LOAD_NAME,
//   WASTE_CHUTE_LOAD_NAME,
//   WASTE_CHUTE_CUTOUT,
// } from '@opentrons/shared-data'

import { useHost } from '../../api'
import { useCreateDeckConfigurationMutation } from '..'

import type { HostConfig } from '@opentrons/api-client'
// import type { DeckConfiguration } from '@opentrons/shared-data'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockCreateDeckConfiguration = createDeckConfiguration as jest.MockedFunction<
  typeof createDeckConfiguration
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

// const mockDeckConfiguration = [
//   {
//     fixtureId: 'mockFixtureWasteChuteId',
//     fixtureLocation: 'cutoutD3',
//     loadName: WASTE_CHUTE_LOAD_NAME,
//   },
// ] as DeckConfiguration

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useCreateDeckConfigurationMutation hook', () => {
  let wrapper: React.FunctionComponent<{}>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data when calling createDeckConfiguration if the request fails', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateDeckConfiguration)
      .calledWith(HOST_CONFIG, [])
      .mockRejectedValue('oh no')

    const { result, waitFor } = renderHook(
      () => useCreateDeckConfigurationMutation(),
      {
        wrapper,
      }
    )
    expect(result.current.data).toBeUndefined()
    result.current.createDeckConfiguration([])
    await waitFor(() => {
      return result.current.status !== 'loading'
    })
    expect(result.current.data).toBeUndefined()
  })
  // ToDo (kk:10/25/2023) this part will be update when backend is ready
  // it('should create a run when calling createDeckConfiguration callback with DeckConfiguration', async () => {
  //   when(useHost).calledWith().mockReturnValue(HOST_CONFIG)
  //   when(mockCreateDeckConfiguration)
  //     .calledWith(HOST_CONFIG, mockDeckConfiguration)
  //     .mockResolvedValue({
  //       data: mockCreateDeckConfiguration,
  //     } as Response<DeckConfiguration>)

  //   const { result, waitFor } = renderHook(useCreateDeckConfigurationMutation, {
  //     wrapper,
  //   })
  //   act(() => result.current.createDeckConfiguration(mockDeckConfiguration))

  //   await waitFor(() => result.current.data != null)
  //   expect(result.current.data).toEqual(mockDeckConfiguration)
  // })
})
