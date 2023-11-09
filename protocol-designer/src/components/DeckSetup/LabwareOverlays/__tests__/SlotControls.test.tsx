import React from 'react'
import { shallow } from 'enzyme'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import {
  CoordinateTuple,
  LabwareDefinition2,
  MAGNETIC_MODULE_TYPE,
} from '@opentrons/shared-data'
import { DND_TYPES } from '../../../../constants'
import * as labwareModuleCompatibility from '../../../../utils/labwareModuleCompatibility'
import { START_TERMINAL_ITEM_ID } from '../../../../steplist'
import { SlotControlsComponent, SlotControlsProps } from '../SlotControls'
import { BlockedSlot } from '../BlockedSlot'

describe('SlotControlsComponent', () => {
  let props: SlotControlsProps
  let getLabwareIsCompatibleSpy: jest.SpiedFunction<
    typeof labwareModuleCompatibility.getLabwareIsCompatible
  >
  beforeEach(() => {
    const slotId = 'D1'
    const slotPosition: CoordinateTuple = [1, 2, 3]
    const slotBoundingBox = {
      xDimension: 10,
      yDimension: 20,
      zDimension: 40,
    }

    const labwareOnDeck = {
      labwareDefURI: 'fixture/fixture_96_plate',
      id: 'plate123',
      slot: '3',
      def: fixture_96_plate as LabwareDefinition2,
    }

    props = {
      slotId,
      slotPosition,
      slotBoundingBox,
      addLabware: jest.fn(),
      moveDeckItem: jest.fn(),
      selectedTerminalItemId: START_TERMINAL_ITEM_ID,
      isOver: true,
      connectDropTarget: el => <svg>{el}</svg>,
      moduleType: MAGNETIC_MODULE_TYPE,
      draggedItem: {
        labwareOnDeck,
      },
      itemType: DND_TYPES.LABWARE,
      customLabwareDefs: {},
    }

    getLabwareIsCompatibleSpy = jest.spyOn(
      labwareModuleCompatibility,
      'getLabwareIsCompatible'
    )
  })

  afterEach(() => {
    getLabwareIsCompatibleSpy.mockClear()
  })

  it('renders nothing when not start terminal item', () => {
    props.selectedTerminalItemId = '__end__'

    const wrapper = shallow(<SlotControlsComponent {...props} />)

    expect(wrapper.get(0)).toBeNull()
  })

  it('gives a slot blocked warning when dragged noncustom and incompatible labware is over a module slot with labware', () => {
    getLabwareIsCompatibleSpy.mockReturnValue(false)

    const wrapper = shallow(<SlotControlsComponent {...props} />)
    const blockedSlot = wrapper.find(BlockedSlot)

    expect(blockedSlot.prop('message')).toBe(
      'MODULE_INCOMPATIBLE_SINGLE_LABWARE'
    )
  })

  it('displays place here when dragged compatible labware is hovered over slot with labware', () => {
    getLabwareIsCompatibleSpy.mockReturnValue(true)

    const wrapper = shallow(<SlotControlsComponent {...props} />)

    expect(wrapper.render().text()).toContain('Place Here')
  })

  it('displays place here when dragged labware is custom and hovered over another labware on module slot', () => {
    props.customLabwareDefs = {
      'fixture/fixture_96_plate': fixture_96_plate as LabwareDefinition2,
    }

    const wrapper = shallow(<SlotControlsComponent {...props} />)

    expect(wrapper.render().text()).toContain('Place Here')
  })

  it('displays add labware when slot is empty', () => {
    props.isOver = false

    const wrapper = shallow(<SlotControlsComponent {...props} />)

    expect(wrapper.render().text()).toContain('Add Labware')
  })
})
