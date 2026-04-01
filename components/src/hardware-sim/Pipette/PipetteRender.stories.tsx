import { Fragment } from 'react'

import { getAllDefinitions, getAllPipetteNames } from '@opentrons/shared-data'

import { RobotWorkSpace } from '../Deck'
import { LabwareRender } from '../Labware'
import { PipetteRender as PipetteRenderComponent } from './'

import type { Meta, StoryObj } from '@storybook/react'
import type { LabwareDefinition, PipetteName } from '@opentrons/shared-data'

const DECK_MAP_VIEWBOX = '0 -140 230 230'

const allDefinitions = getAllDefinitions()

// Find labware definitions by loadName
const findLabwareByLoadName = (
  loadName: string
): LabwareDefinition | undefined => {
  const definitions = Object.values(allDefinitions) as LabwareDefinition[]
  return definitions.find(def => def.parameters.loadName === loadName)
}

const allDefsArray = Object.values(allDefinitions) as LabwareDefinition[]
const defaultDef = allDefsArray[0]

if (defaultDef == null) {
  throw new Error('No labware definitions found')
}

const opentrons300UlTiprack =
  findLabwareByLoadName('opentrons_96_tiprack_300ul') ?? defaultDef
const opentrons10UlTiprack =
  findLabwareByLoadName('opentrons_96_tiprack_10ul') ?? defaultDef
const nest12Reservoir15ml =
  findLabwareByLoadName('nest_12_reservoir_15ml') ?? defaultDef
const axygenReservoir90ml =
  findLabwareByLoadName('axygen_1_reservoir_90ml') ?? defaultDef
const opentrons6TuberackNest50mlConical =
  findLabwareByLoadName('opentrons_6_tuberack_nest_50ml_conical') ?? defaultDef

const labwareDefMap: Record<string, LabwareDefinition> = {
  [opentrons300UlTiprack.metadata.displayName]: opentrons300UlTiprack,
  [opentrons10UlTiprack.metadata.displayName]: opentrons10UlTiprack,
  [nest12Reservoir15ml.metadata.displayName]: nest12Reservoir15ml,
  [axygenReservoir90ml.metadata.displayName]: axygenReservoir90ml,
  [opentrons6TuberackNest50mlConical.metadata.displayName]:
    opentrons6TuberackNest50mlConical,
}
const pipetteNames = Object.keys(getAllPipetteNames()) as PipetteName[]
const labwareDisplayNames = Object.keys(labwareDefMap)

interface StoryArgs {
  labwareName: string
  pipetteName: PipetteName
}

const meta: Meta<StoryArgs> = {
  title: 'Library/Molecules/Simulation/Pipette/PipetteRender',
  argTypes: {
    labwareName: {
      control: {
        type: 'select',
      },
      options: labwareDisplayNames,
    },
    pipetteName: {
      control: {
        type: 'select',
      },
      options: pipetteNames,
    },
  },
  decorators: [
    Story => (
      <RobotWorkSpace viewBox={DECK_MAP_VIEWBOX}>
        {() => <Story />}
      </RobotWorkSpace>
    ),
  ],
}

export default meta

type Story = StoryObj<StoryArgs>

export const PipetteRender: Story = {
  args: {
    labwareName: opentrons300UlTiprack.metadata.displayName,
    pipetteName: pipetteNames[0],
  },
  render: args => {
    const labwareDef = labwareDefMap[args.labwareName] ?? opentrons300UlTiprack
    return (
      <Fragment>
        <LabwareRender definition={labwareDef} positioningMode="passThrough" />
        <PipetteRenderComponent
          labwareDef={labwareDef}
          pipetteName={args.pipetteName}
        />
      </Fragment>
    )
  },
}
