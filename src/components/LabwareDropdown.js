import React from 'react'
import Accordion from './Accordion.js'
import styles from '../css/style.css'

const LabwareItem = ({onContainerChoose, containerType, containerImgUrl, displayName}) => (
  <li
    className={styles.labwareListItem}
    onClick={e => onContainerChoose(containerType)}
    style={containerImgUrl && {'--image-url': `url(${containerImgUrl})`
    }}
  >
    {displayName}
  </li>
)

const LabwareDropdown = ({onClose, onContainerChoose}) => {
  const labwareItemMapper = (item, key) => (
    <LabwareItem key={key}
      containerType={item[0]}
      displayName={item[1]}
      onContainerChoose={onContainerChoose}
      containerImgUrl={item.length >= 3 && `http://docs.opentrons.com/_images/${item[2]}.png`}
    />
  )

  return (
    <div className={styles.labwareDropdown}>
      <label>Labware Type</label>
      <div className='close' onClick={onClose}>X</div>
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
            ['tube-rack-15_50ml', '15mL x 6 + 50mL x 4 Tube Rack', 'Tuberack-15-50ml']
          ].map(labwareItemMapper)}
        </Accordion>
        <Accordion title='Well Plate'>
          {[
            ['96-deep', '96 Deep Well Plate', '96-Deep-Well'],
            ['96-tall', '96 Well Plate (Tall)', '96-PCR-Tall'],
            ['96-flat', '96 Well Plate (Flat)', '96-PCR-Flatt'],
            ['96-custom', '96 Well Plate (CUSTOM)', '96-PCR-Flatt'],
            ['384-plate', '384 Well Plate', '384-plate']
          ].map(labwareItemMapper)}
        </Accordion>
        <Accordion title='Trough'>
          {[
            ['trough-12row', '12-row Trough', 'Trough-12row']
          ].map(labwareItemMapper)}
        </Accordion>
        <Accordion title='PCR Strip'>
          {[
            ['PCR-strip-tall', 'PCR Strip Tall', '96-PCR-Strip']
          ].map(labwareItemMapper)}
        </Accordion>
        <Accordion title='Trash'>
          {[
            ['trash-box', 'Trash Box']
          ].map(labwareItemMapper)}
        </Accordion>
      </ul>
    </div>
  )
}

export default LabwareDropdown
