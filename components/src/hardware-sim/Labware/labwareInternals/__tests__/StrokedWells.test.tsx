import * as React from 'react'
import { render } from '@testing-library/react'
import _uncasted_troughFixture12 from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough_v2.json'
import { StrokedWells } from '../StrokedWells'
import { WellComponent as Well } from '../Well'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

jest.mock('../Well')

const troughFixture12 = _uncasted_troughFixture12 as LabwareDefinition2

const mockWell = Well as jest.MockedFunction<typeof Well>

describe('StrokedWells', () => {
  beforeEach(() => {})
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should render a series of wells with the given stroke', () => {
    mockWell.mockImplementation(({ stroke, wellName }) =>
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      {
        return <div>{`well ${wellName} with stroke ${stroke}`}</div>
      }
    )

    const { getByText } = render(
      <StrokedWells
        definition={troughFixture12}
        strokeByWell={{ A1: 'blue', A2: 'blue' }}
      />
    )
    getByText('well A1 with stroke blue')
    getByText('well A2 with stroke blue')
  })
})
