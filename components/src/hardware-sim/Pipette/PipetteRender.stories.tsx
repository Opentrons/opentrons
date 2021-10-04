import * as React from 'react'
import pipetteNameSpecFixtures from '@opentrons/shared-data/pipette/fixtures/name/pipetteNameSpecFixtures.json'
import _uncasted_opentrons300UlTiprack from '@opentrons/shared-data/labware/definitions/2/opentrons_96_tiprack_300ul/1.json'
import _uncasted_opentrons10UlTiprack from '@opentrons/shared-data/labware/definitions/2/opentrons_96_tiprack_10ul/1.json'
import _uncasted_nest12Reservoir15ml from '@opentrons/shared-data/labware/definitions/2/nest_12_reservoir_15ml/1.json'
import _uncasted_axygenReservoir90ml from '@opentrons/shared-data/labware/definitions/2/axygen_1_reservoir_90ml/1.json'
import _uncasted_opentrons6TuberackNest50mlConical from '@opentrons/shared-data/labware/definitions/2/opentrons_6_tuberack_nest_50ml_conical/1.json'
import { LabwareRender } from '../Labware'
import { RobotWorkSpace } from '../Deck'
import { PipetteRender } from './'

import type { Story, Meta } from '@storybook/react'
import type { LabwareDefinition2, PipetteName } from '@opentrons/shared-data'

const DECK_MAP_VIEWBOX = '0 -140 230 230'

const opentrons300UlTiprack = (_uncasted_opentrons300UlTiprack as unknown) as LabwareDefinition2
const opentrons10UlTiprack = (_uncasted_opentrons10UlTiprack as unknown) as LabwareDefinition2
const nest12Reservoir15ml = _uncasted_nest12Reservoir15ml as LabwareDefinition2
const axygenReservoir90ml = _uncasted_axygenReservoir90ml as LabwareDefinition2
const opentrons6TuberackNest50mlConical = _uncasted_opentrons6TuberackNest50mlConical as LabwareDefinition2

const labwareDefMap: Record<string, LabwareDefinition2> = {
  [opentrons300UlTiprack.metadata.displayName]: opentrons300UlTiprack,
  [opentrons10UlTiprack.metadata.displayName]: opentrons10UlTiprack,
  [nest12Reservoir15ml.metadata.displayName]: nest12Reservoir15ml,
  [axygenReservoir90ml.metadata.displayName]: axygenReservoir90ml,
  [opentrons6TuberackNest50mlConical.metadata
    .displayName]: opentrons6TuberackNest50mlConical,
}
const pipetteNames = Object.keys(pipetteNameSpecFixtures) as PipetteName[]

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
        <React.Fragment>
          <LabwareRender definition={labwareDef} />
          <PipetteRender
            labwareDef={labwareDef}
            pipetteName={args.pipetteName}
          />
        </React.Fragment>
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
