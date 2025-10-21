import { render, screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fixture12Trough } from '@opentrons/shared-data'

import {
  StaticLabwareComponent as StaticLabware,
  StrokedWellsComponent as StrokedWells,
  WellLabelsComponent as WellLabels,
} from '../labwareInternals'
import { LabwareRender, WELL_LABEL_OPTIONS } from '../LabwareRender'

import type { ComponentProps } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'

vi.mock('../labwareInternals')

const troughFixture12 = fixture12Trough as LabwareDefinition

describe('LabwareRender', () => {
  beforeEach(() => {
    vi.mocked(StaticLabware).mockReturnValue(<div>mock static labware</div>)
  })

  it('should render a static labware component', () => {
    const props: ComponentProps<typeof LabwareRender> = {
      definition: troughFixture12,
      positioningMode: 'passThrough',
    }
    render(
      <svg>
        <LabwareRender {...props} />
      </svg>
    )
    screen.getByText('mock static labware')
  })
  it('should render stroked wells', () => {
    const props: ComponentProps<typeof LabwareRender> = {
      definition: troughFixture12,
      positioningMode: 'passThrough',
      wellStroke: { A1: 'blue' },
    }
    vi.mocked(StrokedWells).mockReturnValue(<div>mock stroked wells</div>)
    render(
      <svg>
        <LabwareRender {...props} />
      </svg>
    )
    screen.getByText('mock stroked wells')
  })
  it('should render well labels', () => {
    const props: ComponentProps<typeof LabwareRender> = {
      definition: troughFixture12,
      positioningMode: 'passThrough',
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
