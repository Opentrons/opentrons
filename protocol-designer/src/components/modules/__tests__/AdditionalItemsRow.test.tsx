import * as React from 'react'
import i18n from 'i18next'
import { renderWithProviders } from '@opentrons/components'

import { Portal } from '../../portals/TopPortal'
import { AdditionalItemsRow } from '../AdditionalItemsRow'
import { FlexSlotMap } from '../FlexSlotMap'

jest.mock('../FlexSlotMap')
jest.mock('../../portals/TopPortal')

const mockFlexSlotMap = FlexSlotMap as jest.MockedFunction<typeof FlexSlotMap>
const mockPortal = Portal as jest.MockedFunction<typeof Portal>

const render = (props: React.ComponentProps<typeof AdditionalItemsRow>) => {
  return renderWithProviders(<AdditionalItemsRow {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AdditionalItemsRow', () => {
  let props: React.ComponentProps<typeof AdditionalItemsRow>
  beforeEach(() => {
    props = {
      handleAttachment: jest.fn(),
      isEquipmentAdded: false,
      name: 'gripper',
    }
    mockFlexSlotMap.mockReturnValue(<div>mock slot map</div>)
    mockPortal.mockReturnValue(<div>mock portal</div>)
  })
  it('renders no gripper', () => {
    const { getByRole, getByText } = render(props)
    getByText('Flex Gripper')
    getByRole('button', { name: 'add' }).click()
    expect(props.handleAttachment).toHaveBeenCalled()
  })
  it('renders a gripper', () => {
    props = {
      ...props,
      isEquipmentAdded: true,
    }
    const { getByRole, getByText, getByAltText } = render(props)
    getByText('Flex Gripper')
    getByAltText('Flex Gripper')
    getByText('Model:')
    getByText('GEN1')
    getByRole('button', { name: 'remove' }).click()
    expect(props.handleAttachment).toHaveBeenCalled()
  })
  it('renders no waste chute', () => {
    props = {
      ...props,
      name: 'wasteChute',
    }
    const { getByRole, getByText } = render(props)
    getByText('Waste Chute')
    getByRole('button', { name: 'add' }).click()
    getByText('mock portal')
  })
  it('renders a waste chute', () => {
    props = {
      ...props,
      name: 'wasteChute',
      isEquipmentAdded: true,
      trashBinId: 'mockId',
    }
    const { getByRole, getByText, getByAltText } = render(props)
    getByText('Waste Chute')
    getByAltText('Waste Chute')
    getByText('mock slot map')
    getByText('Position:')
    getByText('D3')
    getByRole('button', { name: 'remove' }).click()
    expect(props.handleAttachment).toHaveBeenCalled()
  })
  it('renders a disabled remove button for waste chute when there is no trash bin', () => {
    props = {
      ...props,
      name: 'wasteChute',
      isEquipmentAdded: true,
    }
    const { getByRole } = render(props)
    expect(getByRole('button', { name: 'remove' })).toBeDisabled()
  })
  it('renders no trash', () => {
    props = {
      ...props,
      name: 'trashBin',
    }
    const { getByRole, getByText } = render(props)
    getByText('Trash Bin')
    getByRole('button', { name: 'add' }).click()
    getByText('mock portal')
  })
  it('renders a trash', () => {
    props = {
      ...props,
      name: 'trashBin',
      isEquipmentAdded: true,
      hasWasteChute: true,
      trashBinId: 'mockId',
      trashBinSlot: 'A3',
    }
    const { getByRole, getByText } = render(props)
    getByText('Trash Bin')
    getByRole('button', { name: 'remove' }).click()
    expect(props.handleAttachment).toHaveBeenCalled()
    getByRole('button', { name: 'edit' }).click()
    getByText('mock portal')
  })
  it('renders a disabled remove button for trash when theres no waste chute', () => {
    props = {
      ...props,
      name: 'trashBin',
      isEquipmentAdded: true,
      hasWasteChute: false,
    }
    const { getByRole, getByText } = render(props)
    getByText('Trash Bin')
    expect(getByRole('button', { name: 'remove' })).toBeDisabled()
  })
})
