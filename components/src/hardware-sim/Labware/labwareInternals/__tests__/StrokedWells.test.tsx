import * as React from 'react'
import { describe, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { LabwareDefinition2, fixture12Trough } from '@opentrons/shared-data'
import { StrokedWells } from '../StrokedWells'
import { WellComponent as Well } from '../Well'

vi.mock('../Well')

const troughFixture12 = fixture12Trough as LabwareDefinition2

describe('StrokedWells', () => {
  it('should render a series of wells with the given stroke', () => {
    vi.mocked(Well).mockImplementation(({ stroke, wellName }) =>
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      {
        return <div>{`well ${wellName} with stroke ${stroke}`}</div>
      }
    )

    render(
      <StrokedWells
        definition={troughFixture12}
        strokeByWell={{ A1: 'blue', A2: 'blue' }}
      />
    )
    screen.getByText('well A1 with stroke blue')
    screen.getByText('well A2 with stroke blue')
  })
})
