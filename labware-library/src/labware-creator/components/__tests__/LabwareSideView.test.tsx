import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fixture_96_plate } from '@opentrons/shared-data/labware/fixtures/2'

import { LabwareSideView } from '../LabwareSideView'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

const plate = fixture_96_plate as LabwareDefinition2

describe('LabwareSideView', () => {
  it('shows a placeholder until the labware can be drawn', () => {
    render(<LabwareSideView definition={null} />)

    screen.getByRole('img', { name: 'Side view' })
    screen.getByText('Add missing info to see labware preview')
  })

  it('draws a side view without measurement labels', () => {
    render(<LabwareSideView definition={plate} />)

    screen.getByRole('img', { name: 'Side view' })
    expect(screen.queryByText(/mm/)).toBeNull()
  })

  it('draws the well hanging past the skirt when it is deeper than the plate', () => {
    render(
      <LabwareSideView
        definition={{
          ...plate,
          dimensions: { ...plate.dimensions, zDimension: 75 },
          skirtHeight: 70,
        }}
      />
    )

    expect(screen.getAllByTestId('well-tip-flat').length).toBe(
      Object.keys(plate.wells).length
    )
  })

  it.each(['flat', 'u', 'v'] as const)(
    'draws a %s tip under the skirt',
    bottomShape => {
      render(
        <LabwareSideView
          definition={{
            ...plate,
            skirtHeight: plate.dimensions.zDimension - 5,
            groups: plate.groups.map((group, index) =>
              index === 0
                ? {
                    ...group,
                    metadata: {
                      ...group.metadata,
                      wellBottomShape: bottomShape,
                    },
                  }
                : group
            ),
          }}
        />
      )

      expect(screen.getAllByTestId(`well-tip-${bottomShape}`).length).toBe(
        Object.keys(plate.wells).length
      )
    }
  )
})
