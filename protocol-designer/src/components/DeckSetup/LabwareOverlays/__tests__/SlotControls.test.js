// @flow

import React from 'react'
import { shallow } from 'enzyme'
import fixture_96_plate_def from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import * as labwareModuleCompatibility from '../../../../utils/labwareModuleCompatibility'
import { SlotControlsComponent } from '../SlotControls'
import { START_TERMINAL_ITEM_ID } from '../../../../steplist'
import { BlockedSlot } from '../BlockedSlot'

import type { LabwareDefinition2, ModuleRealType } from '@opentrons/shared-data'

jest.mock('../../../../utils/labwareModuleCompatibility')

const getLabwareIsCompatibleMock: JestMockFn<
  [LabwareDefinition2, ModuleRealType],
  boolean
> = labwareModuleCompatibility.getLabwareIsCompatible

describe('SlotControlsComponent', () => {
  let props
  beforeEach(() => {
    const slot = {
      id: 'deckSlot1',
      position: [1, 2, 3],
      boundingBox: {
        xDimension: 10,
        yDimension: 20,
        zDimension: 40,
      },
      displayName: 'slot 1',
      compatibleModules: ['magdeck'],
    }

    const labwareOnDeck = {
      labwareDefURI: 'fixture/fixture_96_plate',
      id: 'plate123',
      slot: '3',
      def: fixture_96_plate_def,
    }

    props = {
      slot,
      addLabware: jest.fn(),
      moveDeckItem: jest.fn(),
      selectedTerminalItemId: START_TERMINAL_ITEM_ID,
      isOver: true,
      connectDropTarget: el => <svg>{el}</svg>,
      moduleType: 'magneticModuleType',
      draggedItem: {
        labwareOnDeck,
      },
      customLabwares: {},
    }
  })

  it('renders nothing when not start terminal item', () => {
    props.selectedTerminalItemId = '__end__'

    const wrapper = shallow(<SlotControlsComponent {...props} />)

    expect(wrapper.get(0)).toBeNull()
  })

  it('gives a slot blocked warning when dragged noncustom and incompatible labware is over a module slot with labware', () => {
    getLabwareIsCompatibleMock.mockReturnValue(false)

    const wrapper = shallow(<SlotControlsComponent {...props} />)
    const blockedSlot = wrapper.find(BlockedSlot)

    expect(blockedSlot.prop('message')).toBe(
      'MODULE_INCOMPATIBLE_SINGLE_LABWARE'
    )
  })

  it('displays place here when dragged compatible labware is hovered over slot with labware', () => {
    getLabwareIsCompatibleMock.mockReturnValue(true)

    const wrapper = shallow(<SlotControlsComponent {...props} />)

    expect(wrapper.render().text()).toContain('Place Here')
  })

  it('displays place here when dragged labware is custom and hovered over another labware on module slot', () => {
    props.customLabwares = {
      'fixture/fixture_96_plate': fixture_96_plate_def,
    }

    const wrapper = shallow(<SlotControlsComponent {...props} />)

    expect(wrapper.render().text()).toContain('Place Here')
  })

  it('displays add labware when slot is empty and compatible', () => {
    props.isOver = false
    getLabwareIsCompatibleMock.mockReturnValue(true)

    const wrapper = shallow(<SlotControlsComponent {...props} />)

    expect(wrapper.render().text()).toContain('Add Labware')
  })
})
