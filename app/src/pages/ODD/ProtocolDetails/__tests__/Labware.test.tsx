import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import { when } from 'vitest-when'

import {
  fixture96Plate,
  fixtureTiprack10ul,
  fixtureTiprack300ul,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useRequiredProtocolLabware } from '/app/resources/protocols'

import { Labware } from '../Labware'

import type { ComponentProps } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'

vi.mock('/app/resources/protocols')

const MOCK_PROTOCOL_ID = 'mock_protocol_id'

const render = (props: ComponentProps<typeof Labware>) => {
  return renderWithProviders(<Labware {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Labware', () => {
  let props: ComponentProps<typeof Labware>
  beforeEach(() => {
    props = {
      protocolId: MOCK_PROTOCOL_ID,
    }
    when(vi.mocked(useRequiredProtocolLabware))
      .calledWith(MOCK_PROTOCOL_ID)
      .thenReturn([
        {
          labwareDef: fixtureTiprack10ul as LabwareDefinition,
          lidDisplayName: 'tiprack lid',
          quantity: 1,
        },
        {
          labwareDef: fixtureTiprack300ul as LabwareDefinition,
          quantity: 2,
        },
        {
          labwareDef: fixture96Plate as LabwareDefinition,
          quantity: 1,
        },
        {
          labwareDef: fixtureTiprack10ul as LabwareDefinition,
          quantity: 1,
        },
      ])
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render column headers that indicate where the labware is, what is called, and how many are required', () => {
    render(props)
    screen.getByRole('columnheader', { name: 'Labware Name' })
    screen.getByRole('columnheader', { name: 'Quantity' })
  })
  it('should render the correct location, name, and connected status in each table row', () => {
    render(props)
    screen.getByRole('row', {
      name: 'Opentrons GEB 10uL Tiprack with tiprack lid 1',
    })
    screen.getByRole('row', { name: '300ul Tiprack FIXTURE 2' })
    screen.getByRole('row', { name: 'ANSI 96 Standard Microplate 1' })
  })
})
