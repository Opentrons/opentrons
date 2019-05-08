// @flow
import React, { useState } from 'react'
import {
  ClickOutside,
  OutlineButton,
  type DeckSlot,
} from '@opentrons/components'
import map from 'lodash/map'
import filter from 'lodash/filter'
import startCase from 'lodash/startCase'
import { getLabwareDiagramURL } from '../../images'
import { getAllDefinitions } from '../../labware-defs/utils'
import { PDTitledList } from '../lists'
import LabwareItem from './LabwareItem'
import styles from './styles.css'

type Props = {
  onClose: (e?: *) => mixed,
  selectLabware: (containerType: string) => mixed,
  slot: ?DeckSlot,
  permittedTipracks: Array<string>,
}

const categoryOrder: Array<string> = [
  'tipRack',
  'tubeRack',
  'wellPlate',
  'trough',
  'trash',
]

const LabwareDropdown = (props: Props) => {
  const [selectedCategory, selectCategory] = useState('')

  const labwareItemMapper = (dataRow, key) => {
    const { selectLabware } = props
    const [labwareType, displayName, imgFileName] = dataRow
    return (
      <LabwareItem
        key={key}
        containerType={labwareType}
        displayName={displayName}
        selectLabware={selectLabware}
        // TODO: Ian 2018-02-22 If these images stay, factor out this magic URL more obvious (or import them with webpack)
        labwareImgUrl={getLabwareDiagramURL(imgFileName)}
      />
    )
  }

  const generateSections = () => {
    const { permittedTipracks } = props
    const allDefs = getAllDefinitions()
    console.log(map(getAllDefinitions(), def => def.metadata.displayCategory))
    const sections = categoryOrder.map(category => {
      let labwareInCategory = filter(allDefs, def => {
        const isPermitted =
          category === 'tiprack' &&
          permittedTipracks.includes(def.metadata.name)

        return isPermitted && def.metadata.displayCategory === category
      })

      const toggleCategory = () => selectCategory(category)
      return (
        <PDTitledList
          key={category}
          title={startCase(category)}
          collapsed={selectedCategory !== category}
          onCollapseToggle={toggleCategory}
          onClick={toggleCategory}
          className={styles.labware_selection_modal}
        >
          {labwareInCategory.map(labwareItemMapper)}
        </PDTitledList>
      )
    })

    return sections
  }

  const { onClose, slot } = props
  // do not render without a slot
  if (!slot) return null

  return (
    <ClickOutside onClickOutside={onClose}>
      {({ ref }) => (
        <div ref={ref} className={styles.labware_dropdown}>
          <div className={styles.title}>Slot {slot} Labware</div>
          <ul>{generateSections()}</ul>
          <OutlineButton onClick={onClose}>CLOSE</OutlineButton>
        </div>
      )}
    </ClickOutside>
  )
}

export default LabwareDropdown

// TODO: Ian 2017-07-26 use shared-data labware, need displayName
// [labware type, display name, and optional image url]
const hardcodedLabware = {
  'Tip Rack': [
    ['tiprack-10ul', '10µL Tip Rack', 'Tiprack-10ul'],
    ['tiprack-200ul', '200uL Tip Rack', 'Tiprack-200ul'],
    ['opentrons-tiprack-300ul', '300µL Tip Rack', 'Tiprack-200ul'],
    ['tiprack-1000ul', '1000µL Tip Rack', 'Tiprack-200ul'],
  ],
  'Aluminum Block': [
    [
      'opentrons-aluminum-block-2ml-eppendorf',
      'Aluminum Block - 2mL Eppendorf Tubes',
    ],
    [
      'opentrons-aluminum-block-2ml-screwcap',
      'Aluminum Block - 2mL Screw Cap Tubes',
    ],
    ['opentrons-aluminum-block-96-PCR-plate', 'Aluminum Block - 96 PCR Plate'],
    [
      'opentrons-aluminum-block-PCR-strips-200ul',
      'Aluminum Block - 0.2mL PCR Strips',
    ],
  ],
  'Tube Rack': [
    ['opentrons-tuberack-1.5ml-eppendorf', '1.5mL Tube Rack (4-in-1 Rack)'],
    [
      'opentrons-tuberack-2ml-eppendorf',
      '2mL Eppendorf Tube Rack (4-in-1 Rack)',
    ],
    [
      'opentrons-tuberack-2ml-screwcap',
      '2mL Screw Cap Tube Rack (4-in-1 Rack)',
    ],
    ['opentrons-tuberack-15ml', '15mL Tube Rack (4-in-1 Rack)'],
    ['opentrons-tuberack-50ml', '50mL Tube Rack (4-in-1 Rack)'],
    [
      'opentrons-tuberack-15_50ml',
      '15mL x 6 + 50mL x 4 Tube Rack (4-in-1 Rack)',
      'Opentrons-4-in-1-tuberack-15-50',
    ],
    ['tube-rack-.75ml', '0.75mL Tube Rack (Clear Acrylic)', 'Tuberack-075ml'],
    ['tube-rack-2ml', '2mL Tube Rack (Clear Acrylic)', 'Tuberack-2ml'],
    [
      'tube-rack-15_50ml',
      '15mL x 6 + 50mL x 4 Tube Rack (Clear Acrylic)',
      'Tuberack-15-50ml',
    ],
  ],
  'Well Plate': [
    ['96-deep-well', '96 Deep Well Plate', '96-Deep-Well'],
    ['96-flat', '96 Flat', '96-PCR-Flatt'],
    ['96-PCR-flat', '96 Well PCR Plate (Flat)', '96-PCR-Flatt'],
    ['96-PCR-tall', '96 Well PCR Plate (Tall)', '96-PCR-Tall'],
    ['PCR-strip-tall', 'PCR Strip (Tall)'],
    ['384-plate', '384 Well Plate', '384-plate'],
    ['12-well-plate', '12 Well Plate'],
    ['24-well-plate', '24 Well Plate'],
    ['48-well-plate', '48 Well Plate'],
  ],
  Trough: [['trough-12row', '12-row Trough', 'Trough-12row']],
  Trash: [
    ['trash-box', 'Trash Box'], // no container img
  ],
}
