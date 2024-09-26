import { describe, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { fixture12Trough } from '@opentrons/shared-data'
import {
  StaticLabwareComponent as StaticLabware,
  WellLabelsComponent as WellLabels,
  StrokedWellsComponent as StrokedWells,
} from '../labwareInternals'
import { LabwareRender, WELL_LABEL_OPTIONS } from '../LabwareRender'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../labwareInternals')

const troughFixture12 = fixture12Trough as LabwareDefinition2

describe('LabwareRender', () => {
  beforeEach(() => {
    vi.mocked(StaticLabware).mockReturnValue(<div>mock static labware</div>)
  })

  it('should render a static labware component', () => {
    const props = { definition: troughFixture12 }
    render(
      <svg>
        <LabwareRender {...props} />
      </svg>
    )
    screen.getByText('mock static labware')
  })
  it('should render stroked wells', () => {
    const props = { definition: troughFixture12, wellStroke: { A1: 'blue' } }
    vi.mocked(StrokedWells).mockReturnValue(<div>mock stroked wells</div>)
    render(
      <svg>
        <LabwareRender {...props} />
      </svg>
    )
    screen.getByText('mock stroked wells')
  })
  it('should render well labels', () => {
    const props = {
      definition: troughFixture12,
      wellLabelOption: WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE,
    }
    vi.mocked(WellLabels).mockReturnValue(<div>mock well labels</div>)
    render(
      <svg>
        <LabwareRender {...props} />
      </svg>
    )
    screen.getByText('mock well labels')
  })
})
