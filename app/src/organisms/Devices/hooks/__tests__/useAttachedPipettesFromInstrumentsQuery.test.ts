import * as React from 'react'
import { vi, it, expect, describe } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import {
  instrumentsResponseLeftPipetteFixture,
  instrumentsResponseRightPipetteFixture,
} from '@opentrons/api-client'
import { useAttachedPipettesFromInstrumentsQuery } from '..'

vi.mock('@opentrons/react-api-client')

describe('useAttachedPipettesFromInstrumentsQuery hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  it('returns attached pipettes', () => {
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: {
        data: [
          instrumentsResponseLeftPipetteFixture,
          instrumentsResponseRightPipetteFixture,
        ],
      },
    } as any)

    const { result } = renderHook(
      () => useAttachedPipettesFromInstrumentsQuery(),
      {
        wrapper,
      }
    )

    expect(result.current).toEqual({
      left: {
        ...instrumentsResponseLeftPipetteFixture,
        displayName: 'Flex 1-Channel 1000 μL',
      },
      right: {
        ...instrumentsResponseRightPipetteFixture,
        displayName: 'Flex 1-Channel 1000 μL',
      },
    })
  })
})
