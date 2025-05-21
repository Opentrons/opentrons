import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { fixtureTiprack300ul } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { LabwareInfoOverlay } from '../LabwareInfoOverlay'

import type { ComponentProps } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'

const render = (props: ComponentProps<typeof LabwareInfoOverlay>) => {
  return renderWithProviders(
    <svg>
      <LabwareInfoOverlay {...props} />
    </svg>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

const MOCK_LABWARE_ID = 'some_labware_id'
const MOCK_RUN_ID = 'fake_run_id'

describe('LabwareInfoOverlay', () => {
  let props: ComponentProps<typeof LabwareInfoOverlay>
  beforeEach(() => {
    props = {
      definition: fixtureTiprack300ul as LabwareDefinition,
      displayName: 'fresh tips',
      labwareId: MOCK_LABWARE_ID,
      runId: MOCK_RUN_ID,
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
