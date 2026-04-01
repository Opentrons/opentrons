import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { fixtureTiprack300ul } from '@opentrons/shared-data'

import { LabwareInfoOverlay } from '..'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'

const render = (props: ComponentProps<typeof LabwareInfoOverlay>) => {
  return renderWithProviders(
    <svg>
      <LabwareInfoOverlay {...props} />
    </svg>
  )[0]
}

const MOCK_LABWARE_ID = 'some_labware_id'

describe('LabwareInfoOverlay', () => {
  let props: ComponentProps<typeof LabwareInfoOverlay>
  beforeEach(() => {
    props = {
      definition: fixtureTiprack300ul as LabwareDefinition,
      displayName: 'fresh tips',
      labwareId: MOCK_LABWARE_ID,
    }
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render the labware display name if present', () => {
    render(props)
    screen.getByText('fresh tips')
  })
})
