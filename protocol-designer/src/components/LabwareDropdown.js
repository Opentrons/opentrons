import React from 'react'
import styles from './LabwareDropdown.css'
import Accordion from './Accordion.js'

function LabwareItem ({onContainerChoose, containerType, containerImgUrl, displayName}) {
  return (
    <li
      className={styles.labware_list_item}
      onClick={e => onContainerChoose(containerType)}
      style={containerImgUrl ? {'--image-url': `url(${containerImgUrl})`} : {}}
    >
      {displayName}
    </li>
  )
}

export default function LabwareDropdown ({onClose, onContainerChoose, slot}) {
  // do not render without a slot
  if (!slot) return null

  const labwareItemMapper = (item, key) => (
    // LabwareItem expects item = [containerType, displayName, containerImgUrl(optional)]
    <LabwareItem key={key}
      containerType={item[0]}
      displayName={item[1]}
      onContainerChoose={onContainerChoose}
      containerImgUrl={item.length >= 3 && `http://docs.opentrons.com/_images/${item[2]}.png`}
    />
  )

  return (
    <div className={styles.labware_dropdown}>
      <label>Add Labware to Slot {slot}</label>
      <div className={styles.close} onClick={onClose}>X</div>
      <ul>
        <Accordion title='Tip Rack'>
          {[
            ['tiprack-10ul', '10uL Tip Rack', 'Tiprack-10ul'],
            ['tiprack-200ul', '200uL Tip Rack', 'Tiprack-200ul'],
            ['tiprack-1000ul', '1000uL Tip Rack', 'Tiprack-200ul'],
            ['tiprack-1000ul-chem', '10x10 1000uL Chem-Tip Rack', 'Tiprack-1000ul-chem']
          ].map(labwareItemMapper)}
        </Accordion>
        <Accordion title='Tube Rack'>
          {[
            ['tube-rack-.75ml', '0.75mL Tube Rack', 'Tuberack-075ml'],
            ['tube-rack-2ml', '2mL Tube Rack', 'Tuberack-2ml'],
            ['24-vial-rack', '3.5mL Tube Rack'],
            ['tube-rack-15_50ml', '15mL x 6 + 50mL x 4 Tube Rack', 'Tuberack-15-50ml']
          ].map(labwareItemMapper)}
        </Accordion>
        <Accordion title='Well Plate'>
          {[
            ['96-deep-well', '96 Deep Well Plate', '96-Deep-Well'],
            ['96-flat', '96 Flat', '96-PCR-Flatt'],
            ['96-PCR-flat', '96 Well PCR Plate (Flat)', '96-PCR-Flatt'],
            ['96-PCR-tall', '96 Well PCR Plate (Tall)', '96-PCR-Tall'],
            ['384-plate', '384 Well Plate', '384-plate'],
            ['12-well-plate', '12 Well Plate'],
            ['24-well-plate', '24 Well Plate']
            // ['rigaku-compact-crystallization-plate', 'Rigaku Compact Crystallization Plate']
          ].map(labwareItemMapper)}
        </Accordion>
        <Accordion title='Trough'>
          {[
            ['trough-12row', '12-row Trough', 'Trough-12row']
          ].map(labwareItemMapper)}
        </Accordion>
        {/* <Accordion title='PCR Strip'>
          {[
            ['PCR-strip-tall', 'PCR Strip Tall', '96-PCR-Strip']
          ].map(labwareItemMapper)}
        </Accordion> */}
        <Accordion title='Trash'>
          {[
            ['trash-box', 'Trash Box'] // no container img
          ].map(labwareItemMapper)}
        </Accordion>
      </ul>
    </div>
  )
}
