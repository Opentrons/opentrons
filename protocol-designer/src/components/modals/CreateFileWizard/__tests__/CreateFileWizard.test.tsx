import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LabwareDefinition2 } from '@opentrons/shared-data'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
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
import {
  getAllowAllTipracks,
  getEnableDeckModification,
} from '../../../../feature-flags/selectors'
import { getTiprackOptions } from '../../utils'
import { CreateFileWizard } from '..'

jest.mock('../../../../navigation/selectors')
jest.mock('../../../../load-file/selectors')
jest.mock('../../../../labware-defs/selectors')
jest.mock('../../../../navigation/actions')
jest.mock('../../../../load-file/actions')
jest.mock('../../../../labware-defs/actions')
jest.mock('../../../../step-forms/actions')
jest.mock('../../../../steplist/actions')
jest.mock('../../../../step-forms/actions/additionalItems')
jest.mock('../../../../feature-flags/selectors')
jest.mock('../../../../labware-ingred/actions')
jest.mock('../../utils')

const mockGetNewProtocolModal = getNewProtocolModal as jest.MockedFunction<
  typeof getNewProtocolModal
>
const mockGetCustomLabwareDefsByURI = getCustomLabwareDefsByURI as jest.MockedFunction<
  typeof getCustomLabwareDefsByURI
>
const mockToggleNewProtocolModal = toggleNewProtocolModal as jest.MockedFunction<
  typeof toggleNewProtocolModal
>
const mockCreateNewProtocol = createNewProtocol as jest.MockedFunction<
  typeof createNewProtocol
>
const mockCreateCustomLabwareDefAction = createCustomLabwareDefAction as jest.MockedFunction<
  typeof createCustomLabwareDefAction
>
const mockCreatePipettes = createPipettes as jest.MockedFunction<
  typeof createPipettes
>
const mockCreateContainer = createContainer as jest.MockedFunction<
  typeof createContainer
>
const mockToggleIsGripperRequired = toggleIsGripperRequired as jest.MockedFunction<
  typeof toggleIsGripperRequired
>
const mockGetAllowAllTipracks = getAllowAllTipracks as jest.MockedFunction<
  typeof getAllowAllTipracks
>
const mockGetLabwareDefsByURI = getLabwareDefsByURI as jest.MockedFunction<
  typeof getLabwareDefsByURI
>
const mockGetTiprackOptions = getTiprackOptions as jest.MockedFunction<
  typeof getTiprackOptions
>
const mockCreateModule = createModule as jest.MockedFunction<
  typeof createModule
>
const mockCreateDeckFixture = createDeckFixture as jest.MockedFunction<
  typeof createDeckFixture
>
const mockGetEnableDeckModification = getEnableDeckModification as jest.MockedFunction<
  typeof getEnableDeckModification
>
const render = () => {
  return renderWithProviders(<CreateFileWizard />)[0]
}

const fixtureTipRack10ul = {
  ...fixture_tiprack_10_ul,
  version: 2,
} as LabwareDefinition2
const ten = '10uL'

describe('CreateFileWizard', () => {
  beforeEach(() => {
    mockGetEnableDeckModification.mockReturnValue(false)
    mockGetNewProtocolModal.mockReturnValue(true)
    mockGetAllowAllTipracks.mockReturnValue(false)
    mockGetLabwareDefsByURI.mockReturnValue({
      [ten]: fixtureTipRack10ul,
    })
    mockGetTiprackOptions.mockReturnValue([
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
  it('renders the wizard for an OT-2', () => {
    render()
    screen.getByText('Create New Protocol')
    //  select OT-2
    fireEvent.click(screen.getByText('OT-2'))
    let next = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(next)
    //  add protocol name
    screen.getByText('Step 1 / 6')
    const inputField = screen.getByLabelText('MetadataTile_protocolName')
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
    expect(mockCreateNewProtocol).toHaveBeenCalled()
    expect(mockCreatePipettes).toHaveBeenCalled()
    expect(mockCreateModule).not.toHaveBeenCalled()
    expect(mockCreateContainer).toHaveBeenCalled()
  })
  it('renders the wizard and clicking on the exit button calls correct selector', () => {
    render()
    screen.getByText('Create New Protocol')
    //  select OT-2
    fireEvent.click(screen.getByText('OT-2'))
    const next = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(next)
    fireEvent.click(screen.getByText('exit'))
    expect(mockToggleNewProtocolModal).toHaveBeenCalled()
  })
  it('renders the wizard for a Flex with custom tiprack', () => {
    mockGetEnableDeckModification.mockReturnValue(true)
    const Custom = 'custom'
    mockGetCustomLabwareDefsByURI.mockReturnValue({
      [Custom]: fixtureTipRack10ul,
    })
    mockGetTiprackOptions.mockReturnValue([
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
    const inputField = screen.getByLabelText('MetadataTile_protocolName')
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
    expect(mockCreateNewProtocol).toHaveBeenCalled()
    expect(mockCreatePipettes).toHaveBeenCalled()
    expect(mockCreateCustomLabwareDefAction).toHaveBeenCalled()
    expect(mockToggleIsGripperRequired).toHaveBeenCalled()
    expect(mockCreateDeckFixture).toHaveBeenCalled()
  })
})
