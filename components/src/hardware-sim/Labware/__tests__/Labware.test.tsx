import { describe, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { fixture12Trough } from '@opentrons/shared-data'
import {
  LabwareOutline,
  LabwareWellLabelsComponent as LabwareWellLabels,
} from '../labwareInternals'
import { Labware } from '../Labware'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../labwareInternals')

const troughFixture12 = fixture12Trough as LabwareDefinition2

describe('Labware', () => {
  beforeEach(() => {
    vi.mocked(LabwareOutline).mockReturnValue(<div>mock labware outline</div>)
  })

  it('should render a labware outline', () => {
    const props = { definition: troughFixture12 }
    render(
      <svg>
        <Labware {...props} />
      </svg>
    )
    screen.getByText('mock labware outline')
  })
  it('should render well labels', () => {
    const props = {
      definition: troughFixture12,
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
