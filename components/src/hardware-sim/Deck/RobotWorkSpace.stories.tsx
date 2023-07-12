import * as React from 'react'
import { RobotWorkSpace } from './RobotWorkSpace'
import { SlotLabels } from './SlotLabels'
import { RobotCoordsForeignDiv, Module } from '@opentrons/components'
import { getModuleDef2, OT3_STANDARD_MODEL } from '@opentrons/shared-data'
import { getDeckDefinitions } from './getDeckDefinitions'
import type { INode } from 'svgson'

import type { Story, Meta } from '@storybook/react'

const allDeckDefs = getDeckDefinitions()

const getLayerIds = (layers: INode[]): string[] => {
  return layers.reduce<string[]>((acc, layer) => {
    if (layer.attributes.id) {
      return [...acc, layer.attributes.id]
    }
    return []
  }, [])
}

export default {
  title: 'Library/Molecules/Simulation/Deck',
} as Meta

const Template: Story<React.ComponentProps<typeof RobotWorkSpace>> = ({
  deckDef,
  ...args
}) => {
  const deckLoadName: unknown = deckDef
  const resolvedDef: typeof deckDef = allDeckDefs[deckLoadName as string]
  return <RobotWorkSpace deckDef={resolvedDef} {...args} />
}
export const Deck = Template.bind({})
Deck.argTypes = {
  deckDef: {
    options: Object.keys(allDeckDefs),
    control: {
      type: 'select',
    },
    defaultValue: 'ot2_standard',
  },
  deckLayerBlocklist: {
    options: [
      ...getLayerIds(allDeckDefs.ot2_standard.layers),
      ...getLayerIds(allDeckDefs.ot3_standard.layers),
    ],
    control: {
      type: 'check',
    },
    defaultValue: '',
  },
}
Deck.args = {
  children: ({ deckSlotsById }) => {
    const divSlot = Object.values(deckSlotsById)[2] as any
    const moduleSlot = Object.values(deckSlotsById)[0] as any
    return (
      <>
        <RobotCoordsForeignDiv
          x={divSlot.position[0] - 30}
          y={divSlot.position[1]}
          width={divSlot.boundingBox.xDimension}
          height={divSlot.boundingBox.yDimension}
        >
          <input
            style={{
              backgroundColor: 'lightgray',
              margin: '1rem',
              width: '6rem',
            }}
            placeholder="example input"
          />
        </RobotCoordsForeignDiv>

        <Module
          def={getModuleDef2('temperatureModuleV1')}
          x={moduleSlot.position[0]}
          y={moduleSlot.position[1]}
        />
      </>
    )
  },
}

const SlotLabelTemplate: Story<
  React.ComponentProps<typeof RobotWorkSpace> & { hasSlotLabels: boolean }
> = ({ hasSlotLabels }) => {
  return (
    <RobotWorkSpace deckDef={getDeckDefinitions().ot3_standard}>
      {({ deckSlotsById }) => {
        const divSlot = Object.values(deckSlotsById)[2] as any
        const moduleSlot = Object.values(deckSlotsById)[0] as any
        return (
          <>
            <RobotCoordsForeignDiv
              x={divSlot.position[0] - 30}
              y={divSlot.position[1]}
              width={divSlot.boundingBox.xDimension}
              height={divSlot.boundingBox.yDimension}
            >
              <input
                style={{
                  backgroundColor: 'lightgray',
                  margin: '1rem',
                  width: '6rem',
                }}
                placeholder="example input"
              />
            </RobotCoordsForeignDiv>

            <Module
              def={getModuleDef2('temperatureModuleV1')}
              x={moduleSlot.position[0]}
              y={moduleSlot.position[1]}
            />
            {hasSlotLabels ? (
              <SlotLabels robotType={OT3_STANDARD_MODEL} />
            ) : null}
          </>
        )
      }}
    </RobotWorkSpace>
  )
}

export const FlexDeckWithSlotLabels = SlotLabelTemplate.bind({})
FlexDeckWithSlotLabels.argTypes = {
  hasSlotLabels: {
    control: {
      type: 'boolean',
    },
    defaultValue: true,
  },
}
