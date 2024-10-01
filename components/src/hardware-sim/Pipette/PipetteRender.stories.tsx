import { Fragment } from 'react'
import { getAllLabwareDefs, getAllPipetteNames } from '@opentrons/shared-data'
import { LabwareRender } from '../Labware'
import { RobotWorkSpace } from '../Deck'
import { PipetteRender } from './'

import type { Story, Meta } from '@storybook/react'
import type { LabwareDefinition2, PipetteName } from '@opentrons/shared-data'

const DECK_MAP_VIEWBOX = '0 -140 230 230'

const opentrons300UlTiprack = getAllLabwareDefs().opentrons96Tiprack300UlV1
const opentrons10UlTiprack = getAllLabwareDefs().opentrons96Tiprack10UlV1
const nest12Reservoir15ml = getAllLabwareDefs().nest12Reservoir15MlV1
const axygenReservoir90ml = getAllLabwareDefs().axygen1Reservoir90MlV1
const opentrons6TuberackNest50mlConical = getAllLabwareDefs()
  .opentrons6TuberackNest50MlConicalV1

const labwareDefMap: Record<string, LabwareDefinition2> = {
  [opentrons300UlTiprack.metadata.displayName]: opentrons300UlTiprack,
  [opentrons10UlTiprack.metadata.displayName]: opentrons10UlTiprack,
  [nest12Reservoir15ml.metadata.displayName]: nest12Reservoir15ml,
  [axygenReservoir90ml.metadata.displayName]: axygenReservoir90ml,
  [opentrons6TuberackNest50mlConical.metadata
    .displayName]: opentrons6TuberackNest50mlConical,
}
const pipetteNames = Object.keys(getAllPipetteNames()) as PipetteName[]

export default {
  title: 'Library/Molecules/Simulation/Pipette/PipetteRender',
} as Meta

const Template: Story<{
  labwareName: string
  pipetteName: PipetteName
}> = args => {
  const labwareDef = labwareDefMap[args.labwareName]
  return (
    <RobotWorkSpace viewBox={DECK_MAP_VIEWBOX}>
      {() => (
        <Fragment>
          <LabwareRender definition={labwareDef} />
          <PipetteRender
            labwareDef={labwareDef}
            pipetteName={args.pipetteName}
          />
        </Fragment>
      )}
    </RobotWorkSpace>
  )
}
export const Pipette = Template.bind({})

Pipette.argTypes = {
  labwareName: {
    control: {
      type: 'select',
      options: Object.keys(labwareDefMap).map(
        d => labwareDefMap[d].metadata.displayName
      ),
    },
    defaultValue: opentrons300UlTiprack.metadata.displayName,
  },
  pipetteName: {
    control: {
      type: 'select',
      options: pipetteNames,
    },
    defaultValue: pipetteNames[0],
  },
}
