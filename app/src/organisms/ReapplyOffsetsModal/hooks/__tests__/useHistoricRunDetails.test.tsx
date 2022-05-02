// tests for the HostConfig context and hook
import * as React from 'react'
import { when } from 'jest-when'
import { renderHook } from '@testing-library/react-hooks'
import { useAllRunsQuery } from '@opentrons/react-api-client'

import type { State } from '../../../redux/types'

jest.mock('@opentrons/react-api-client')

const mockUseAllRunsQuery = useAllRunsQuery as jest.MockedFunction<
  typeof useAllRunsQuery
>

describe('useHistoricRunDetails', () => {
  when(mockUseAllRunsQuery)
    .calledWith()
    .mockReturnValue({
      //TODO
    })

  it('TODO ', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <div>{children}</div>
    )
    const { result } = renderHook(useHistoricRunDetails, { wrapper })
  })
})
