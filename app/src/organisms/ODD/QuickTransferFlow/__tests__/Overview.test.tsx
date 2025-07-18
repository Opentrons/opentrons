import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { Overview } from '../Overview'

import type { ComponentProps } from 'react'

vi.mock('/app/redux/config')

const render = (props: ComponentProps<typeof Overview>) => {
  return renderWithProviders(<Overview {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Overview', () => {
  let props: ComponentProps<typeof Overview>

  beforeEach(() => {
    props = {
      state: {
        pipette: {
          displayName: 'Pipette display name',
        } as any,
        tipRack: {
          metadata: {
            displayName: 'Tip rack display name',
          },
        } as any,
        source: {
          metadata: {
            displayName: 'Source labware name',
          },
        } as any,
        destination: {
          metadata: {
            displayName: 'Destination labware name',
          },
        } as any,
        transferType: 'transfer',
        volume: 25,
        liquidClass: {
          liquidClassName: 'dummyLiquidClass',
          displayName: 'Dummy liquid class',
          description: 'Dummy liquid class description',
          schemaVersion: 0,
          namespace: '',
          byPipette: [],
        },
      } as any,
    }
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the summary fields for a 1 to 1 transfer', () => {
    render(props)
    screen.getByText('Pipette')
    screen.getByText('Pipette display name')
    screen.getByText('Tip rack')
    screen.getByText('Tip rack display name')
    screen.getByText('Source labware')
    screen.getByText('Source labware name')
    screen.getByText('Destination labware')
    screen.getByText('Destination labware name')
    screen.getByText('Volume per well')
    screen.getByText('25µL')
  })
  it('renders the correct volume wording for n to 1 transfer', () => {
    props = {
      state: {
        pipette: {
          displayName: 'Pipette display name',
        } as any,
        tipRack: {
          metadata: {
            displayName: 'Tip rack display name',
          },
        } as any,
        source: {
          metadata: {
            displayName: 'Source labware name',
          },
        } as any,
        destination: {
          metadata: {
            displayName: 'Destination labware name',
          },
        } as any,
        transferType: 'consolidate',
        volume: 25,
      } as any,
    }
    render(props)
    screen.getByText('Aspirate volume per well')
  })
  it('renders the correct volume wording for 1 to n transfer', () => {
    props = {
      state: {
        pipette: {
          displayName: 'Pipette display name',
        } as any,
        tipRack: {
          metadata: {
            displayName: 'Tip rack display name',
          },
        } as any,
        source: {
          metadata: {
            displayName: 'Source labware name',
          },
        } as any,
        destination: {
          metadata: {
            displayName: 'Destination labware name',
          },
        } as any,
        transferType: 'distribute',
        volume: 25,
      } as any,
    }
    render(props)
    screen.getByText('Dispense volume per well')
  })

  it('should render correct items when liquid classes are enabled', () => {
    render(props)
    screen.getByText('Pipette')
    screen.getByText('Pipette display name')
    screen.getByText('Tip rack')
    screen.getByText('Tip rack display name')
    screen.getByText('Source labware')
    screen.getByText('Source labware name')
    screen.getByText('Destination labware')
    screen.getByText('Destination labware name')
    screen.getByText('Pipette path')
    screen.getByText('Tip change frequency')
    screen.getByText('Tip drop location')
    screen.getByText('Liquid class')
    screen.getByText('Dummy liquid class')
  })
})
