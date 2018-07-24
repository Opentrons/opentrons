// @flow
import * as React from 'react'
import {
  TitledList,
  OutlineButton,
  type DeckSlot
} from '@opentrons/components'
import SelectedWrapper from './SelectedWrapper'
import styles from './styles.css'

type selectLabware = (containerType: string) => void

type LabwareItemProps = {
  selectLabware: selectLabware,
  containerType: string,
  displayName: string,
  containerImgUrl?: string
}

function LabwareItem (props: LabwareItemProps) {
  const {selectLabware, containerType, containerImgUrl, displayName} = props
  return (
    <li
      className={styles.labware_list_item}
      onClick={() => selectLabware(containerType)}
      style={containerImgUrl ? {'--image-url': `url(${containerImgUrl})`} : {}}
    >
      {displayName}
    </li>
  )
}

type Props = {
  onClose: (e?: SyntheticEvent<*>) => mixed,
  selectLabware: selectLabware,
  slot: ?DeckSlot,
  permittedTipracks: Array<string>,
  select: (?string) => mixed,
  selectedSection: ?string
}

// labware type, display name, and image url
const hardcodedLabware = {
  'Tip Rack': [
    ['tiprack-10ul', '10uL Tip Rack', 'Tiprack-10ul'],
    ['tiprack-200ul', '200uL Tip Rack', 'Tiprack-200ul'],
    ['tiprack-1000ul', '1000uL Tip Rack', 'Tiprack-200ul'],
    ['tiprack-1000ul-chem', '10x10 1000uL Chem-Tip Rack', 'Tiprack-1000ul-chem']
  ],
  'Tube Rack': [
    ['tube-rack-.75ml', '0.75mL Tube Rack', 'Tuberack-075ml'],
    ['tube-rack-2ml', '2mL Tube Rack', 'Tuberack-2ml'],
    ['24-vial-rack', '3.5mL Tube Rack'],
    ['tube-rack-15_50ml', '15mL x 6 + 50mL x 4 Tube Rack', 'Tuberack-15-50ml']
  ],
  'Well Plate': [
    ['96-deep-well', '96 Deep Well Plate', '96-Deep-Well'],
    ['96-flat', '96 Flat', '96-PCR-Flatt'],
    ['96-PCR-flat', '96 Well PCR Plate (Flat)', '96-PCR-Flatt'],
    ['96-PCR-tall', '96 Well PCR Plate (Tall)', '96-PCR-Tall'],
    ['384-plate', '384 Well Plate', '384-plate'],
    ['12-well-plate', '12 Well Plate'],
    ['24-well-plate', '24 Well Plate']
    // ['rigaku-compact-crystallization-plate', 'Rigaku Compact Crystallization Plate']
  ],
  'Trough': [
    ['trough-12row', '12-row Trough', 'Trough-12row']
  ],
  // 'PCR Strip': [
  //   ['PCR-strip-tall', 'PCR Strip Tall', '96-PCR-Strip']
  // ],
  'Trash': [
    ['trash-box', 'Trash Box'] // no container img
  ]
}

const labwareSectionOrder: Array<$Keys<typeof hardcodedLabware>> = [
  'Tip Rack',
  'Tube Rack',
  'Well Plate',
  'Trough',
  'Trash'
]

function LabwareDropdown (props: Props) {
  const {onClose, selectLabware, slot, permittedTipracks, selectedSection, select} = props
  // do not render without a slot
  if (!slot) return null

  const labwareItemMapper = (item, key) => (
    // LabwareItem expects item = [type, displayName, containerImgUrl(optional)]
    <LabwareItem key={key}
      containerType={item[0]}
      displayName={item[1]}
      selectLabware={selectLabware}
      // TODO Ian 2018-02-22 If these images stay, factor out this magic URL more obvious (or import them with webpack)
      containerImgUrl={item.length >= 3 ? `http://docs.opentrons.com/_images/${item[2]}.png` : undefined}
    />
  )

  const sections = labwareSectionOrder.map(section => {
    const listProps = {
      title: section,
      collapsed: selectedSection !== section,
      onCollapseToggle: () => select(section),
      onClick: () => select(section)
    }

    let labwareInSection = hardcodedLabware[section]
    if (section === 'Tip Rack') {
      // filter out tip rack labware that doesn't match pipettes
      labwareInSection = labwareInSection.filter(labwareModelNameImage =>
        permittedTipracks.includes(labwareModelNameImage[0])
      )
    }
    return (
      <TitledList {...listProps} key={section}>
        {labwareInSection.map(labwareItemMapper)}
      </TitledList>
    )
  })

  return (
    <div className={styles.labware_dropdown}>
      <div className={styles.title}>Slot {slot} Labware</div>
      <ul>
        {sections}
      </ul>
      <OutlineButton onClick={onClose}>CLOSE</OutlineButton>
    </div>
  )
}

type FinalProps = $Diff<Props, {selectedSection: *, select: *}>

export default function WrappedLabwareDropdown (props: FinalProps) {
  return <SelectedWrapper render={({selected, select}) =>
    <LabwareDropdown {...{...props, selectedSection: selected, select}}/>} />
}
