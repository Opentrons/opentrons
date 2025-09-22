import { render, screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fixture12Trough } from '@opentrons/shared-data'

import { Labware } from '../Labware'
import {
  LabwareOutline,
  LabwareWellLabelsComponent as LabwareWellLabels,
} from '../labwareInternals'

import type { ComponentProps } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'

vi.mock('../labwareInternals')

const troughFixture12 = fixture12Trough as LabwareDefinition

describe('Labware', () => {
  beforeEach(() => {
    vi.mocked(LabwareOutline).mockReturnValue(<div>mock labware outline</div>)
  })

  it('should render a labware outline', () => {
    const props: ComponentProps<typeof Labware> = {
      definition: troughFixture12,
      positioningMode: 'passThrough',
    }
    render(
      <svg>
        <Labware {...props} />
      </svg>
    )
    screen.getByText('mock labware outline')
  })
  it('should render well labels', () => {
    const props: ComponentProps<typeof Labware> = {
      definition: troughFixture12,
      positioningMode: 'passThrough',
      showLabels: true,
    }
    vi.mocked(LabwareWellLabels).mockReturnValue(<div>mock well labels</div>)
    render(
      <svg>
        <Labware {...props} />
      </svg>
    )
    screen.getByText('mock well labels')
  })
})
