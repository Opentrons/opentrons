import * as React from 'react'
<<<<<<< HEAD
import { vi, it, expect, describe, beforeEach } from 'vitest'
=======
import { vi, it, expect, describe } from 'vitest'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
import { renderHook } from '@testing-library/react'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import {
  instrumentsResponseLeftPipetteFixture,
  instrumentsResponseRightPipetteFixture,
} from '@opentrons/api-client'
import { useIsOEMMode } from '../../../../resources/robot-settings/hooks'
import { useAttachedPipettesFromInstrumentsQuery } from '..'

vi.mock('@opentrons/react-api-client')
<<<<<<< HEAD
vi.mock('../../../../resources/robot-settings/hooks')
=======
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))

describe('useAttachedPipettesFromInstrumentsQuery hook', () => {
  beforeEach(() => {
    vi.mocked(useIsOEMMode).mockReturnValue(false)
  })

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
