import * as React from 'react'
import {
  getModuleDef2,
  LabwareDefinition2,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  ModuleModel,
  OT2_STANDARD_DECKID,
  OT3_STANDARD_DECKID,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import { RobotWorkSpace } from '../Deck/RobotWorkSpace'
import { getDeckDefinitions } from '../Deck/getDeckDefinitions'

import { LabwareRender } from '../Labware'
import { Module as ModuleComponent } from './'

import type { RobotWorkSpaceRenderProps } from '../Deck'
import type { Story, Meta } from '@storybook/react'

const slots = ['1', '3', '4', '6', '7', '9', '10']

const moduleModels: ModuleModel[] = [
  TEMPERATURE_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
]

export default {
  title: 'Library/Molecules/Simulation/Modules/Module',
} as Meta

const Template: Story<{
  slot: string
  model: ModuleModel
  orientation: 'left' | 'right'
  hasLabware: boolean
  deckType: typeof OT2_STANDARD_DECKID | typeof OT3_STANDARD_DECKID
}> = args => {
  return (
    <RobotWorkSpace deckDef={getDeckDefinitions()[args.deckType]}>
      {({ deckSlotsById }: RobotWorkSpaceRenderProps) => {
        const slot = deckSlotsById[args.slot]
        return (
          <ModuleComponent
            def={getModuleDef2(args.model)}
            x={slot.position[0]}
            y={slot.position[1]}
            innerProps={{ lidMotorState: 'open' }}
            orientation={args.orientation}
          >
            {args.hasLabware ? (
              <LabwareRender
                definition={fixture_96_plate as LabwareDefinition2}
              />
            ) : null}
          </ModuleComponent>
        )
      }}
    </RobotWorkSpace>
  )
}
export const Module = Template.bind({})
Module.argTypes = {
  slot: {
    control: {
      type: 'select',
      options: slots,
    },
    defaultValue: slots[slots.length - 1],
  },
  model: {
    control: {
      type: 'select',
      options: moduleModels,
    },
    defaultValue: moduleModels[0],
  },
  orientation: {
    control: {
      type: 'select',
      options: ['left', 'right'],
    },
    defaultValue: 'left',
  },
  hasLabware: {
    control: {
      type: 'boolean',
    },
    defaultValue: false,
  },
  deckType: {
    control: {
      type: 'select',
      options: [OT2_STANDARD_DECKID, OT3_STANDARD_DECKID],
    },
    defaultValue: 'left',
  },
}
