import * as React from 'react'
import plate from '@opentrons/shared-data/labware/definitions/2/opentrons_96_wellplate_200ul_pcr_full_skirt/1.json'
import { Flex, RobotCoordinateSpace, RobotWorkSpace } from '@opentrons/components'
import { SelectableLabware } from './SelectableLabware'

/**
 * This page is only accessible with developer tools on
 * It provides and easy prototyping space for view layer code
 * on the On Device Display app of the Flex
 * @returns JSX.Element
 */
export function DevSandbox(): JSX.Element {
  const [selectedWells, setSelectedWells] = React.useState({})

  return (
    <Flex height="100vh" width="100vw">
        <SelectableLabware
          labwareProps={{ definition: plate }}
          selectedPrimaryWells={selectedWells}
          selectWells={(wellGroup) => { setSelectedWells(prevWells => ({...prevWells, ...wellGroup})) }}
          deselectWells={(wellGroup) => { setSelectedWells(wellGroup) }}
          updateHighlightedWells={(wellGroup) => { console.log(wellGroup) }}
          nozzleType={null}
          ingredNames={{}}
          wellContents={{}}
        />
    </Flex>
  )
}
