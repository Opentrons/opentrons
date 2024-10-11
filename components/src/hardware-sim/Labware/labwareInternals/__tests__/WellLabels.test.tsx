import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { fixture12Trough as _fixture12Trough } from '@opentrons/shared-data'
import { WellLabels } from '../WellLabels'
import { WELL_LABEL_OPTIONS } from '../../LabwareRender'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const troughFixture12 = _fixture12Trough as LabwareDefinition2

describe('WellLabels', () => {
  it('should render well labels outside of the labware', () => {
    expect.assertions(14)
    const props = {
      definition: troughFixture12,
      wellLabelOption: WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE,
    }
    render(
      <svg>
        <WellLabels {...props} />
      </svg>
    )
    const wellLabels = screen.getAllByTestId('WellsLabels_show_inside')
    expect(wellLabels.length).toBe(13) // 1 label for the single "A" row + 12 labels for the trough columns
    expect(wellLabels[0]).toHaveTextContent('A')
    // assertions for each of the numbered columns, skipping the first well label which has the letter row
    new Array(12)
      .fill(null)
      .forEach((_, index) =>
        expect(wellLabels[index + 1]).toHaveTextContent(`${index + 1}`)
      )
  })
  it('should render well labels inside of the labware', () => {
    expect.assertions(14)
    const props = {
      definition: troughFixture12,
      wellLabelOption: WELL_LABEL_OPTIONS.SHOW_LABEL_OUTSIDE,
    }
    render(
      <svg>
        <WellLabels {...props} />
      </svg>
    )
    const wellLabels = screen.getAllByTestId('WellsLabels_show_outside')
    expect(wellLabels.length).toBe(13) // 1 label for the single "A" row + 12 labels for the trough columns
    expect(wellLabels[0]).toHaveTextContent('A')
    // assertions for each of the numbered columns, skipping the first well label which has the letter row
    new Array(12)
      .fill(null)
      .forEach((_, index) =>
        expect(wellLabels[index + 1]).toHaveTextContent(`${index + 1}`)
      )
  })
  it('should highlight the well labels with the given color', () => {
    expect.assertions(13) // there should be 13 highlighted well labels
    const props = {
      definition: troughFixture12,
      wellLabelOption: WELL_LABEL_OPTIONS.SHOW_LABEL_OUTSIDE,
      highlightedWellLabels: {
        wells: Object.keys(troughFixture12.wells),
        color: 'blue',
      },
    }
    render(
      <svg>
        <WellLabels {...props} />
      </svg>
    )
    const wellLabels = screen.getAllByTestId('WellsLabels_show_outside')
    wellLabels.forEach(wellLabel =>
      expect(wellLabel.getAttribute('fill')).toBe('blue')
    )
  })
  it('should color the well labels', () => {
    expect.assertions(13) // there should be 13 highlighted well labels
    const props = {
      definition: troughFixture12,
      wellLabelOption: WELL_LABEL_OPTIONS.SHOW_LABEL_OUTSIDE,
      wellLabelColor: 'red',
    }
    render(
      <svg>
        <WellLabels {...props} />
      </svg>
    )
    const wellLabels = screen.getAllByTestId('WellsLabels_show_outside')
    wellLabels.forEach(wellLabel =>
      expect(wellLabel.getAttribute('fill')).toBe('red')
    )
  })
})
