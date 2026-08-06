// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'

import {
  ABSORBANCE_READER_V1,
  fixture96Plate,
  FLEX_STACKER_MODULE_V1,
  getModuleDef,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'

import { CenterLabwareInModuleChildSlot } from '../alignment'
import { LabwareRender } from '../Labware'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { Module as ModuleComponent } from './'

import type { Meta, StoryFn } from '@storybook/react'
import type { LabwareDefinition, ModuleModel } from '@opentrons/shared-data'

const moduleModels: ModuleModel[] = [
  TEMPERATURE_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1,
  ABSORBANCE_READER_V1,
  FLEX_STACKER_MODULE_V1,
]

const moduleModelOptions = {
  'Temperature Module V2': TEMPERATURE_MODULE_V2,
  'Temperature Module V1': TEMPERATURE_MODULE_V1,
  'Thermocycler Module V1': THERMOCYCLER_MODULE_V1,
  'Thermocycler Module V2': THERMOCYCLER_MODULE_V2,
  'Magnetic Module V1': MAGNETIC_MODULE_V1,
  'Magnetic Module V2': MAGNETIC_MODULE_V2,
  'Heater-Shaker Module V1': HEATERSHAKER_MODULE_V1,
  'Magnetic Block V1': MAGNETIC_BLOCK_V1,
  'Absorbance Reader V1': ABSORBANCE_READER_V1,
  'Flex Stacker Module V1': FLEX_STACKER_MODULE_V1,
}

export default {
  title: 'Library/Molecules/Simulation/Module',
} as Meta

const Template: StoryFn<{
  model: ModuleModel
  orientation: 'left' | 'right'
  hasLabware: boolean
  innerProps: Record<string, unknown>
}> = args => {
  // Add null check and default to first module model if undefined
  const moduleModel: ModuleModel = args.model ?? moduleModels[0]
  const moduleDef = getModuleDef(moduleModel)
  const labwareDef: LabwareDefinition | null = args.hasLabware
    ? (fixture96Plate as LabwareDefinition)
    : null

  return (
    <RobotCoordinateSpace height="100vh" width="100vw" viewBox="0 -50 200 320">
      <ModuleComponent
        def={moduleDef}
        x={0}
        y={0}
        innerProps={args.innerProps}
        orientation={args.orientation}
        targetSlotId={null}
        targetDeckId={null}
        childrenPositioningMode="passThrough"
      >
        {labwareDef != null ? (
          <CenterLabwareInModuleChildSlot
            deckId={null}
            slotId={null}
            moduleDefinition={moduleDef}
            labwareDefinition={labwareDef}
          >
            <LabwareRender
              definition={labwareDef}
              positioningMode="passThrough"
            />
          </CenterLabwareInModuleChildSlot>
        ) : null}
      </ModuleComponent>
    </RobotCoordinateSpace>
  )
}

export const Module = Template.bind({})
Module.args = {
  model: TEMPERATURE_MODULE_V2,
  orientation: 'left',
  hasLabware: false,
  innerProps: {
    lidMotorState: 'open',
    blockTargetTemp: 90,
    targetTemperature: 4,
    targetTemp: 40,
  },
}

Module.argTypes = {
  model: {
    control: {
      type: 'select',
    },
    options: moduleModelOptions,
  },
  orientation: {
    control: {
      type: 'select',
    },
    options: ['left', 'right'],
  },
  hasLabware: {
    control: {
      type: 'boolean',
    },
  },
  innerProps: {
    control: {
      type: 'object',
    },
  },
}
