import * as React from 'react'
import { fireEvent } from '@testing-library/react'
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
import { createCustomLabwareDefAction } from '../../../../labware-defs/actions'
import { createModule, createPipettes } from '../../../../step-forms/actions'
import { changeSavedStepForm } from '../../../../steplist/actions'
import { toggleIsGripperRequired } from '../../../../step-forms/actions/additionalItems'
import { getAllowAllTipracks } from '../../../../feature-flags/selectors'
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
const mockChangeSavedStepForm = changeSavedStepForm as jest.MockedFunction<
  typeof changeSavedStepForm
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
    const { getByText, getByRole, getByLabelText } = render()
    getByText('Create New Protocol')
    //  select OT-2
    getByText('OT-2').click()
    let next = getByRole('button', { name: 'Next' })
    next.click()
    //  add protocol name
    getByText('Step 1 / 6')
    const inputField = getByLabelText('MetadataTile_protocolName')
    fireEvent.change(inputField, { target: { value: 'mockName' } })
    next = getByRole('button', { name: 'Next' })
    next.click()
    getByText('Step 2 / 6')
    //  select P20 Single-Channel GEN2
    getByLabelText('EquipmentOption_flex_P20 Single-Channel GEN2').click()
    next = getByRole('button', { name: 'Next' })
    next.click()
    getByText('Step 3 / 6')
    //  select 10uL tipracks
    getByLabelText('EquipmentOption_flex_10uL tipracks').click()
    next = getByRole('button', { name: 'Next' })
    next.click()
    getByText('Step 4 / 6')
    //  select none for 2nd pipette
    getByLabelText('EquipmentOption_flex_None').click()
    next = getByRole('button', { name: 'Next' })
    next.click()
    getByText('Step 6 / 6')
    //  no modules and continue
    getByRole('button', { name: 'Review file details' }).click()
    expect(mockCreateNewProtocol).toHaveBeenCalled()
    expect(mockCreatePipettes).toHaveBeenCalled()
    expect(mockCreateModule).not.toHaveBeenCalled()
    expect(mockChangeSavedStepForm).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        stepId: '__INITIAL_DECK_SETUP_STEP__',
        update: {
          labwareLocationUpdate: {
            fixedTrash: {
              slotName: '12',
            },
          },
        },
      })
    )
  })
  it('renders the wizard and clicking on the exit button calls correct selector', () => {
    const { getByText, getByRole } = render()
    getByText('Create New Protocol')
    //  select OT-2
    getByText('OT-2').click()
    const next = getByRole('button', { name: 'Next' })
    next.click()
    getByText('exit').click()
    expect(mockToggleNewProtocolModal).toHaveBeenCalled()
  })
  it('renders the wizard for a Flex with custom tiprack', () => {
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
    const { getByText, getByRole, getByLabelText } = render()
    getByText('Create New Protocol')
    //  select Flex
    getByText('Opentrons Flex').click()
    let next = getByRole('button', { name: 'Next' })
    next.click()
    //  add protocol name
    getByText('Step 1 / 6')
    const inputField = getByLabelText('MetadataTile_protocolName')
    fireEvent.change(inputField, { target: { value: 'mockName' } })
    next = getByRole('button', { name: 'Next' })
    next.click()
    getByText('Step 2 / 6')
    //  select flex pipette
    getByLabelText('EquipmentOption_flex_Flex 1-Channel 50 μL').click()
    next = getByRole('button', { name: 'Next' })
    next.click()
    getByText('Step 3 / 6')
    //  select flex 200uL tipracks
    getByLabelText('EquipmentOption_flex_200uL Flex tipracks').click()
    next = getByRole('button', { name: 'Next' })
    next.click()
    getByText('Step 4 / 6')
    //  select 2nd pipette
    getByLabelText('EquipmentOption_flex_Flex 1-Channel 50 μL').click()
    next = getByRole('button', { name: 'Next' })
    next.click()
    //  select custom tip
    getByText('Step 5 / 6')
    getByLabelText('PipetteTipsTile_customTipButton').click()
    getByLabelText('EquipmentOption_flex_Custom').click()
    next = getByRole('button', { name: 'Next' })
    next.click()
    getByText('Step 6 / 6')
    //  select gripper
    getByLabelText('EquipmentOption_flex_Gripper').click()
    getByRole('button', { name: 'Review file details' }).click()
    expect(mockCreateNewProtocol).toHaveBeenCalled()
    expect(mockCreatePipettes).toHaveBeenCalled()
    expect(mockCreateCustomLabwareDefAction).toHaveBeenCalled()
    expect(mockToggleIsGripperRequired).toHaveBeenCalled()
    expect(mockChangeSavedStepForm).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        stepId: '__INITIAL_DECK_SETUP_STEP__',
        update: {
          labwareLocationUpdate: {
            fixedTrash: {
              slotName: 'A3',
            },
          },
        },
      })
    )
  })
})
