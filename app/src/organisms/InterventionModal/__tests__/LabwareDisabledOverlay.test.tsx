import * as React from 'react'
import { render } from '@testing-library/react'

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
    const { getByTestId } = render(
      <svg>
        <LabwareDisabledOverlay definition={mockLabwareDef} />
      </svg>
    )

    const overlayBg = getByTestId('overlay_rect')
    const overlayIcon = getByTestId('overlay_icon')

    expect(overlayBg).toHaveAttribute('width', '84')
    expect(overlayBg).toHaveAttribute('height', '42')
    expect(overlayBg).toHaveAttribute('fill', '#ffffff')
    expect(overlayBg).toHaveAttribute('fill-opacity', '0.9')
    expect(overlayIcon).toHaveAttribute('stroke', '#bf0000')
  })
})
