import { UseQueryResult } from 'react-query'
import { useAllSessionsQuery } from '@opentrons/react-api-client'
import { useIsLegacySessionInProgress } from '../useIsLegacySessionInProgress'

import type { Sessions } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')

const mockUseAllSessionsQuery = useAllSessionsQuery as jest.MockedFunction<
  typeof useAllSessionsQuery
>
describe(' useIsLegacySessionInProgress ', () => {
  beforeEach(() => {
    mockUseAllSessionsQuery.mockReturnValue(({
      data: [],
      links: null,
    } as unknown) as UseQueryResult<Sessions, Error>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns false when sessions are empty', () => {
    const result = useIsLegacySessionInProgress()
    expect(result).toStrictEqual(false)
  })

  it('returns  true when sessions are not empty', () => {
    mockUseAllSessionsQuery.mockReturnValue(({
      data: {
        data: {
          id: 'id',
          sessionType: 'calibrationCheck',
          createParams: 'params',
        },
      },
      links: {},
    } as unknown) as UseQueryResult<Sessions, Error>)
    const result = useIsLegacySessionInProgress()
    expect(result).toStrictEqual(true)
  })
})
