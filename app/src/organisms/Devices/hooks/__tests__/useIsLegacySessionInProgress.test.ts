import { vi, it, expect, describe, beforeEach, afterEach } from 'vitest'
import { useAllSessionsQuery } from '@opentrons/react-api-client'
import { useIsLegacySessionInProgress } from '../useIsLegacySessionInProgress'

import type { UseQueryResult } from 'react-query'
import type { Sessions } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')

describe('useIsLegacySessionInProgress', () => {
  beforeEach(() => {
    vi.mocked(useAllSessionsQuery).mockReturnValue(({
      data: [],
      links: null,
    } as unknown) as UseQueryResult<Sessions, Error>)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns false when sessions are empty', () => {
    const result = useIsLegacySessionInProgress()
    expect(result).toStrictEqual(false)
  })

  it('returns  true when sessions are not empty', () => {
    vi.mocked(useAllSessionsQuery).mockReturnValue(({
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
