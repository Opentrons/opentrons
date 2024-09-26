import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { fixture12Trough as _fixture12Trough } from '@opentrons/shared-data'
import { LabwareWellLabels } from '../LabwareWellLabels'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

const troughFixture12 = _fixture12Trough as LabwareDefinition2

describe('LabwareWellLabels', () => {
  it('should render well labels', () => {
    const props = {
      definition: troughFixture12,
    }
    render(
      <svg>
        <LabwareWellLabels {...props} />
      </svg>
    )

    screen.getByText('A')
    new Array(12)
      .fill(null)
      .forEach((_, index) => screen.getByText(`${index + 1}`))
  })
  it('should highlight the well labels with the given color', () => {
    expect.assertions(13) // there should be 13 highlighted well labels
    const props = {
      definition: troughFixture12,
      highlightedWellLabels: {
        wells: Object.keys(troughFixture12.wells as Record<string, unknown>),
        color: 'blue',
      },
    }
    render(
      <svg>
        <LabwareWellLabels {...props} />
      </svg>
    )
    const letterWellLabel = screen.getByText('A')
    expect(letterWellLabel.getAttribute('fill')).toBe('blue')
    new Array(12).fill(null).forEach((_, index) => {
      const numberWellLabel = screen.getByText(`${index + 1}`)
      expect(numberWellLabel.getAttribute('fill')).toBe('blue')
    })
  })
  it('should color the well labels', () => {
    expect.assertions(13) // there should be 13 well labels
    const props = {
      definition: troughFixture12,
      wellLabelColor: 'red',
    }
    render(
      <svg>
        <LabwareWellLabels {...props} />
      </svg>
    )
    const letterWellLabel = screen.getByText('A')
    expect(letterWellLabel.getAttribute('fill')).toBe('red')
    new Array(12).fill(null).forEach((_, index) => {
      const numberWellLabel = screen.getByText(`${index + 1}`)
      expect(numberWellLabel.getAttribute('fill')).toBe('red')
    })
  })
})
