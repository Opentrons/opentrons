import * as React from 'react'
import { renderHook } from '@testing-library/react'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import {
  instrumentsResponseLeftPipetteFixture,
  instrumentsResponseRightPipetteFixture,
} from '@opentrons/api-client'
import { useAttachedPipettesFromInstrumentsQuery } from '..'

jest.mock('@opentrons/react-api-client')

const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>
describe('useAttachedPipettesFromInstrumentsQuery hook', () => {
  let wrapper: React.FunctionComponent<{children: React.ReactNode}>
  it('returns attached pipettes', () => {
    mockUseInstrumentsQuery.mockReturnValue({
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
