import * as React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen, cleanup } from '@testing-library/react'
import { fixture_tiprack_10_ul } from '@opentrons/shared-data/labware/fixtures/2'
import { renderWithProviders } from '../../../../__testing-utils__' 
import { i18n } from '../../../../localization'
import { getNewProtocolModal } from '../../../../navigation/selectors'
import {
  getCustomLabwareDefsByURI,
  getLabwareDefsByURI,
} from '../../../../labware-defs/selectors'
import { toggleNewProtocolModal } from '../../../../navigation/actions'
import { createNewProtocol } from '../../../../load-file/actions'
import { createContainer } from '../../../../labware-ingred/actions'
import { createCustomLabwareDefAction } from '../../../../labware-defs/actions'
import { createModule, createPipettes } from '../../../../step-forms/actions'
import {
  toggleIsGripperRequired,
  createDeckFixture,
} from '../../../../step-forms/actions/additionalItems'
import { getAllowAllTipracks } from '../../../../feature-flags/selectors'
import { getTiprackOptions } from '../../utils'
import { CreateFileWizard } from '..'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../../../../navigation/selectors')
vi.mock('../../../../load-file/selectors')
vi.mock('../../../../labware-defs/selectors')
vi.mock('../../../../navigation/actions')
vi.mock('../../../../load-file/actions')
vi.mock('../../../../labware-defs/actions')
vi.mock('../../../../step-forms/actions')
vi.mock('../../../../steplist/actions')
vi.mock('../../../../step-forms/actions/additionalItems')
vi.mock('../../../../feature-flags/selectors')
vi.mock('../../../../labware-ingred/actions')
vi.mock('../../utils')

const render = () => {
  return renderWithProviders(<CreateFileWizard />, { i18nInstance: i18n })[0]
}

const fixtureTipRack10ul = {
  ...fixture_tiprack_10_ul,
  version: 2,
} as LabwareDefinition2
const ten = '10uL'

describe('CreateFileWizard', () => {
  beforeEach(() => {
    vi.mocked(getNewProtocolModal).mockReturnValue(true)
    vi.mocked(getAllowAllTipracks).mockReturnValue(false)
    vi.mocked(getLabwareDefsByURI).mockReturnValue({
      [ten]: fixtureTipRack10ul,
    })
    vi.mocked(getTiprackOptions).mockReturnValue([
      {
        name: '10uL tipracks',
        value: 'opentrons/opentrons_96_tiprack_10ul/1',
      },
      {
        name: '300uL tipracks',
        value: 'opentrons/opentrons_96_tiprack_300ul/1',
      },
    ])
  })
  afterEach(() => {
    cleanup()
  })
  it('renders the wizard for an OT-2', async () => {
    render()
    screen.getByText('Create New Protocol')
    //  select OT-2
    fireEvent.click(screen.getByText('OT-2'))
    let next = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(next)
    //  add protocol name
    screen.getByText('Step 1 / 6')
    const inputField = screen.getByTestId('MetadataTile_protocolName')
    fireEvent.change(inputField, { target: { value: 'mockName' } })
    next = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(next)
    screen.getByText('Step 2 / 6')
    //  select P20 Single-Channel GEN2
    fireEvent.click(
      screen.getByLabelText('EquipmentOption_flex_P20 Single-Channel GEN2')
    )
    next = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(next)
    screen.getByText('Step 3 / 6')
    //  select 10uL tipracks
    fireEvent.click(screen.getByLabelText('EquipmentOption_flex_10uL tipracks'))
    next = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(next)
    screen.getByText('Step 4 / 6')
    //  select none for 2nd pipette
    fireEvent.click(screen.getByLabelText('EquipmentOption_flex_None'))
    next = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(next)
    screen.getByText('Step 6 / 6')
    //  no modules and continue
    fireEvent.click(screen.getByRole('button', { name: 'Review file details' }))
    expect(vi.mocked(createNewProtocol)).toHaveBeenCalled()
    expect(vi.mocked(createPipettes)).toHaveBeenCalled()
    expect(vi.mocked(createModule)).not.toHaveBeenCalled()
    expect(vi.mocked(createContainer)).toHaveBeenCalled()
  })
  it('renders the wizard and clicking on the exit button calls correct selector', () => {
    render()
    screen.getByText('Create New Protocol')
    //  select OT-2
    fireEvent.click(screen.getByText('OT-2'))
    const next = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(next)
    fireEvent.click(screen.getByText('exit'))
    expect(vi.mocked(toggleNewProtocolModal)).toHaveBeenCalled()
  })
  it('renders the wizard for a Flex with custom tiprack', () => {
    const Custom = 'custom'
    vi.mocked(getCustomLabwareDefsByURI).mockReturnValue({
      [Custom]: fixtureTipRack10ul,
    })
    vi.mocked(getTiprackOptions).mockReturnValue([
      {
        name: '200uL Flex tipracks',
        value: 'opentrons/opentrons_flex_96_tiprack_200ul/1',
      },
      {
        name: '1000uL Flex tipracks',
        value: 'opentrons/opentrons_flex_96_tiprack_1000ul/1',
      },
      {
        name: 'Custom',
        value: 'custom_beta_blah_blah_blah',
      },
    ])
    render()
    screen.getByText('Create New Protocol')
    //  select Flex
    fireEvent.click(screen.getByText('Opentrons Flex'))
    let next = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(next)
    //  add protocol name
    screen.getByText('Step 1 / 7')
    const inputField = screen.getByTestId('MetadataTile_protocolName')
    fireEvent.change(inputField, { target: { value: 'mockName' } })
    next = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(next)
    screen.getByText('Step 2 / 7')
    //  select flex pipette
    fireEvent.click(
      screen.getByLabelText('EquipmentOption_flex_Flex 1-Channel 50 μL')
    )
    next = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(next)
    screen.getByText('Step 3 / 7')
    //  select flex 200uL tipracks
    fireEvent.click(
      screen.getByLabelText('EquipmentOption_flex_200uL Flex tipracks')
    )
    next = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(next)
    screen.getByText('Step 4 / 7')
    //  select 2nd pipette
    fireEvent.click(
      screen.getByLabelText('EquipmentOption_flex_Flex 1-Channel 50 μL')
    )
    next = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(next)
    //  select custom tip
    screen.getByText('Step 5 / 7')
    fireEvent.click(screen.getByLabelText('PipetteTipsTile_customTipButton'))
    fireEvent.click(screen.getByLabelText('EquipmentOption_flex_Custom'))
    next = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(next)
    screen.getByText('Step 6 / 7')
    //  select a staging area
    screen.getByText('Staging area slots')
    next = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(next)
    screen.getByText('Step 7 / 7')
    //  select gripper and waste chute
    fireEvent.click(screen.getByLabelText('EquipmentOption_flex_Gripper'))
    fireEvent.click(screen.getByLabelText('EquipmentOption_flex_Waste Chute'))
    fireEvent.click(screen.getByRole('button', { name: 'Review file details' }))
    expect(vi.mocked(createNewProtocol)).toHaveBeenCalled()
    expect(vi.mocked(createPipettes)).toHaveBeenCalled()
    expect(vi.mocked(createCustomLabwareDefAction)).toHaveBeenCalled()
    expect(vi.mocked(toggleIsGripperRequired)).toHaveBeenCalled()
    expect(vi.mocked(createDeckFixture)).toHaveBeenCalled()
  })
})
