import * as React from 'react'
import { render } from '@testing-library/react'
import { resetAllWhenMocks, when } from 'jest-when'
import _uncasted_troughFixture12 from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough_v2.json'
import { componentPropsMatcher } from '../../../testing/utils'
import {
  StaticLabwareComponent as StaticLabware,
  WellLabelsComponent as WellLabels,
  StrokedWellsComponent as StrokedWells,
} from '../labwareInternals'
import { LabwareRender, WELL_LABEL_OPTIONS } from '../LabwareRender'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

jest.mock('../labwareInternals')

const mockStaticLabware = StaticLabware as jest.MockedFunction<
  typeof StaticLabware
>
const mockWellLabels = WellLabels as jest.MockedFunction<typeof WellLabels>
const mockStrokedWells = StrokedWells as jest.MockedFunction<
  typeof StrokedWells
>

const troughFixture12 = _uncasted_troughFixture12 as LabwareDefinition2

describe('LabwareRender', () => {
  beforeEach(() => {
    when(mockStaticLabware)
      .calledWith(componentPropsMatcher({ definition: troughFixture12 }))
      .mockReturnValue(<div>mock static labware</div>)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should render a static labware component', () => {
    const props = { definition: troughFixture12 }
    const { getByText } = render(
      <svg>
        <LabwareRender {...props} />
      </svg>
    )
    getByText('mock static labware')
  })
  it('should render stroked wells', () => {
    const props = { definition: troughFixture12, wellStroke: { A1: 'blue' } }
    when(mockStrokedWells)
      .calledWith(
        componentPropsMatcher({
          definition: troughFixture12,
          strokeByWell: { A1: 'blue' },
        })
      )
      .mockReturnValue(<div>mock stroked wells</div>)
    const { getByText } = render(
      <svg>
        <LabwareRender {...props} />
      </svg>
    )
    getByText('mock stroked wells')
  })
  it('should render well labels', () => {
    const props = {
      definition: troughFixture12,
      wellLabelOption: WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE,
    }
    when(mockWellLabels)
      .calledWith(
        componentPropsMatcher({
          definition: troughFixture12,
          wellLabelOption: WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE,
        })
      )
      .mockReturnValue(<div>mock well labels</div>)
    const { getByText } = render(
      <svg>
        <LabwareRender {...props} />
      </svg>
    )
    getByText('mock well labels')
  })
})
