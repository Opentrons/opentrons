import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__' 
import { i18n } from '../../../localization'
import { AdditionalItemsRow } from '../AdditionalItemsRow'
import { FlexSlotMap } from '../FlexSlotMap'

jest.mock('../FlexSlotMap')

const mockFlexSlotMap = FlexSlotMap as jest.MockedFunction<typeof FlexSlotMap>

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
  })
  it('renders no gripper', () => {
    render(props)
    screen.getByText('Flex Gripper')
    fireEvent.click(screen.getByRole('button', { name: 'add' }))
    expect(props.handleAttachment).toHaveBeenCalled()
  })
  it('renders a gripper', () => {
    props = {
      ...props,
      isEquipmentAdded: true,
    }
    render(props)
    screen.getByText('Flex Gripper')
    screen.getByAltText('Flex Gripper')
    screen.getByText('Model:')
    screen.getByText('GEN1')
    fireEvent.click(screen.getByRole('button', { name: 'remove' }))
    expect(props.handleAttachment).toHaveBeenCalled()
  })
  it('renders no waste chute', () => {
    props = {
      ...props,
      name: 'wasteChute',
    }
    render(props)
    screen.getByText('Waste Chute')
    fireEvent.click(screen.getByRole('button', { name: 'add' }))
  })
  it('renders a waste chute', () => {
    props = {
      ...props,
      name: 'wasteChute',
      isEquipmentAdded: true,
      trashBinId: 'mockId',
    }
    render(props)
    screen.getByText('Waste Chute')
    screen.getByAltText('Waste Chute')
    screen.getByText('mock slot map')
    screen.getByText('Position:')
    screen.getByText('D3')
    fireEvent.click(screen.getByRole('button', { name: 'remove' }))
    expect(props.handleAttachment).toHaveBeenCalled()
  })
  it('renders a disabled remove button for waste chute when there is no trash bin', () => {
    props = {
      ...props,
      name: 'wasteChute',
      isEquipmentAdded: true,
    }
    render(props)
    expect(screen.getByRole('button', { name: 'remove' })).toBeDisabled()
  })
  it('renders no trash', () => {
    props = {
      ...props,
      name: 'trashBin',
    }
    render(props)
    screen.getByText('Trash Bin')
    fireEvent.click(screen.getByRole('button', { name: 'add' }))
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
    render(props)
    screen.getByText('Trash Bin')
    fireEvent.click(screen.getByRole('button', { name: 'remove' }))
    expect(props.handleAttachment).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'edit' }))
  })
  it('renders a disabled remove button for trash when theres no waste chute', () => {
    props = {
      ...props,
      name: 'trashBin',
      isEquipmentAdded: true,
      hasWasteChute: false,
    }
    render(props)
    screen.getByText('Trash Bin')
    expect(screen.getByRole('button', { name: 'remove' })).toBeDisabled()
  })
})
