import * as React from 'react'
import { vi, it, describe, beforeEach, afterEach } from 'vitest'
import { when } from 'vitest-when'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { useRequiredProtocolLabware } from '../../Protocols/hooks'
import { Labware } from '../Labware'

import {
  fixtureTiprack10ul,
  fixtureTiprack300ul,
  fixture96Plate,
} from '@opentrons/shared-data'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../../Protocols/hooks')

const MOCK_PROTOCOL_ID = 'mock_protocol_id'

const render = (props: React.ComponentProps<typeof Labware>) => {
  return renderWithProviders(<Labware {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Labware', () => {
  let props: React.ComponentProps<typeof Labware>
  beforeEach(() => {
    props = {
      protocolId: MOCK_PROTOCOL_ID,
    }
    when(vi.mocked(useRequiredProtocolLabware))
      .calledWith(MOCK_PROTOCOL_ID)
      .thenReturn([
        {
          definition: fixtureTiprack10ul as LabwareDefinition2,
          initialLocation: { slotName: '1' },
          moduleLocation: null,
          moduleModel: null,
          nickName: null,
        },
        {
          definition: fixtureTiprack300ul as LabwareDefinition2,
          initialLocation: { slotName: '3' },
          moduleLocation: null,
          moduleModel: null,
          nickName: null,
        },
        {
          definition: fixture96Plate as LabwareDefinition2,
          initialLocation: { slotName: '5' },
          moduleLocation: null,
          moduleModel: null,
          nickName: null,
        },
        {
          definition: fixtureTiprack10ul as LabwareDefinition2,
          initialLocation: { slotName: '7' },
          moduleLocation: null,
          moduleModel: null,
          nickName: null,
        },
      ])
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render column headers that indicate where the labware is, what is called, and how many are required', () => {
    const { getByRole } = render(props)[0]
    getByRole('columnheader', { name: 'Labware Name' })
    getByRole('columnheader', { name: 'Quantity' })
  })
  it('should render the correct location, name, and connected status in each table row', () => {
    const { getByRole } = render(props)[0]
    getByRole('row', { name: 'Opentrons GEB 10uL Tiprack 2' })
    getByRole('row', { name: '300ul Tiprack FIXTURE 1' })
    getByRole('row', { name: 'ANSI 96 Standard Microplate 1' })
  })
})
