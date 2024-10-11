import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { COLORS } from '@opentrons/components'
import { LabwareDisabledOverlay } from '../LabwareDisabledOverlay'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const mockLabwareDef = {
  dimensions: {
    xDimension: 84,
    yDimension: 42,
  },
} as LabwareDefinition2

describe('LabwareDisabledOverlay', () => {
  it("renders correctly for a given labware definition's dimensions", () => {
    render(
      <svg>
        <LabwareDisabledOverlay definition={mockLabwareDef} />
      </svg>
    )

    const overlayBg = screen.getByTestId('overlay_rect')
    const overlayIcon = screen.getByTestId('overlay_icon')

    expect(overlayBg).toHaveAttribute('width', '84')
    expect(overlayBg).toHaveAttribute('height', '42')
    expect(overlayBg).toHaveAttribute('fill', '#FFFFFF')
    expect(overlayBg).toHaveAttribute('fill-opacity', '0.9')
    expect(overlayIcon).toHaveAttribute('stroke', COLORS.red50)
  })
})
