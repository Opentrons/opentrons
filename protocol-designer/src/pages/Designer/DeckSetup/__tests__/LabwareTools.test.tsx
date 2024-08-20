import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import {
  FLEX_ROBOT_TYPE,
  fixtureP1000SingleV2Specs,
  fixtureTiprack1000ul,
} from '@opentrons/shared-data'
import { i18n } from '../../../../assets/localization'
import { renderWithProviders } from '../../../../__testing-utils__'
import {
  getInitialDeckSetup,
  getPermittedTipracks,
  getPipetteEntities,
} from '../../../../step-forms/selectors'
import { getHas96Channel } from '../../../../utils'
import { createCustomLabwareDef } from '../../../../labware-defs/actions'
import { getCustomLabwareDefsByURI } from '../../../../labware-defs/selectors'
import { getRobotType } from '../../../../file-data/selectors'
import { LabwareTools } from '../LabwareTools'
import type { LabwareDefinition2, PipetteV2Specs } from '@opentrons/shared-data'

vi.mock('../../../../utils')
vi.mock('../../../../step-forms/selectors')
vi.mock('../../../../file-data/selectors')
vi.mock('../../../../labware-defs/selectors')
vi.mock('../../../../labware-defs/actions')

const render = (props: React.ComponentProps<typeof LabwareTools>) => {
  return renderWithProviders(<LabwareTools {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LabwareTools', () => {
  let props: React.ComponentProps<typeof LabwareTools>

  beforeEach(() => {
    props = {
      slot: 'D3',
      selectedHardware: null,
      setSelectedLabwareDefURI: vi.fn(),
      selecteLabwareDefURI: null,
      setNestedSelectedLabwareDefURI: vi.fn(),
      selectedNestedSelectedLabwareDefURI: null,
    }
    vi.mocked(getCustomLabwareDefsByURI).mockReturnValue({})
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    vi.mocked(getPermittedTipracks).mockReturnValue([])
    vi.mocked(getPipetteEntities).mockReturnValue({
      pip: {
        tiprackDefURI: ['mockTipUri'],
        spec: fixtureP1000SingleV2Specs as PipetteV2Specs,
        name: 'p1000_single_flex',
        id: 'mockPipId',
        tiprackLabwareDef: [fixtureTiprack1000ul as LabwareDefinition2],
      },
    })
    vi.mocked(getHas96Channel).mockReturnValue(false)
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {},
      labware: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
    })
  })

  it('renders an empty slot with all the labware options', () => {
    render(props)
    screen.getByText('Add labware')
    screen.getByText('Tube rack')
    screen.getByText('Well plate')
    screen.getByText('Reservoir')
    screen.getByText('Aluminum block')
    screen.getByText('Adapter')
    //  click and expand well plate accordion
    fireEvent.click(screen.getAllByTestId('ListButton_noActive')[1])
    fireEvent.click(
      screen.getByRole('label', { name: 'Corning 384 Well Plate' })
    )
    //  set labware
    expect(props.setSelectedLabwareDefURI).toHaveBeenCalled()
  })
  it('renders deck slot and selects an adapter and labware', () => {
    props.selecteLabwareDefURI =
      'fixture/fixture_universal_flat_bottom_adapter/1'
    render(props)
    screen.getByText('Adapter')
    fireEvent.click(screen.getAllByTestId('ListButton_noActive')[4])
    //   set adapter
    fireEvent.click(
      screen.getByRole('label', {
        name: 'Fixture Opentrons Universal Flat Heater-Shaker Adapter',
      })
    )
    //  set labware
    screen.getByText('Adapter compatible labware')
    screen.getByText('Fixture Corning 96 Well Plate 360 µL Flat')
    fireEvent.click(
      screen.getByRole('label', {
        name: 'Fixture Corning 96 Well Plate 360 µL Flat',
      })
    )
    expect(props.setNestedSelectedLabwareDefURI).toHaveBeenCalled()
  })

  it('renders the custom labware flow', () => {
    render(props)
    screen.getByText('Add custom labware')
    fireEvent.change(screen.getByTestId('customLabwareInput'))
    expect(vi.mocked(createCustomLabwareDef)).toHaveBeenCalled()
  })
})
