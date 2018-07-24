// @flow
import * as React from 'react'
import {
  TitledList,
  OutlineButton,
  type DeckSlot
} from '@opentrons/components'
import SelectedWrapper from './SelectedWrapper'
import styles from './styles.css'

type OnContainerChoose = (containerType: string) => void

type LabwareItemProps = {
  onContainerChoose: OnContainerChoose,
  containerType: string,
  displayName: string,
  containerImgUrl?: string
}

function LabwareItem (props: LabwareItemProps) {
  const {onContainerChoose, containerType, containerImgUrl, displayName} = props
  return (
    <li
      className={styles.labware_list_item}
      onClick={() => onContainerChoose(containerType)}
      style={containerImgUrl ? {'--image-url': `url(${containerImgUrl})`} : {}}
    >
      {displayName}
    </li>
  )
}

type Props = {
  onClose: (e?: SyntheticEvent<*>) => mixed,
  onContainerChoose: OnContainerChoose,
  slot: ?DeckSlot,
  permittedTipracks: Array<string>,
  select: (?string) => mixed,
  selectedSection: ?string
}

function LabwareDropdown (props: Props) {
  const {onClose, onContainerChoose, slot, permittedTipracks, selectedSection, select} = props
  // do not render without a slot
  if (!slot) return null

  const labwareItemMapper = (item, key) => (
    // LabwareItem expects item = [containerType, displayName, containerImgUrl(optional)]
    <LabwareItem key={key}
      containerType={item[0]}
      displayName={item[1]}
      onContainerChoose={onContainerChoose}
      // TODO Ian 2018-02-22 If these images stay, factor out this magic URL more obvious (or import them with webpack)
      containerImgUrl={item.length >= 3 ? `http://docs.opentrons.com/_images/${item[2]}.png` : undefined}
    />
  )

  // TODO IMMEDIATELY should I continue with this, or ditch SelectedWrapper?
  // Is collapsing one section independent of others, or can only one be open?
  const listPropsHack = (title: string) => ({
    title,
    collapsed: selectedSection !== title,
    onCollapseToggle: () => select(title),
    onClick: () => select(title)
  })

  return (
    <div className={styles.labware_dropdown}>
      <div className={styles.title}>Slot {slot} Labware</div>
      <ul>
        <TitledList {...listPropsHack('Tip Rack')}>
          {[
            ['tiprack-10ul', '10uL Tip Rack', 'Tiprack-10ul'],
            ['tiprack-200ul', '200uL Tip Rack', 'Tiprack-200ul'],
            ['tiprack-1000ul', '1000uL Tip Rack', 'Tiprack-200ul'],
            ['tiprack-1000ul-chem', '10x10 1000uL Chem-Tip Rack', 'Tiprack-1000ul-chem']
          ].filter(labwareModelNameImage =>
            permittedTipracks.includes(labwareModelNameImage[0])
          ).map(labwareItemMapper)}
        </TitledList>
        <TitledList {...listPropsHack('Tube Rack')}>
          {[
            ['tube-rack-.75ml', '0.75mL Tube Rack', 'Tuberack-075ml'],
            ['tube-rack-2ml', '2mL Tube Rack', 'Tuberack-2ml'],
            ['24-vial-rack', '3.5mL Tube Rack'],
            ['tube-rack-15_50ml', '15mL x 6 + 50mL x 4 Tube Rack', 'Tuberack-15-50ml']
          ].map(labwareItemMapper)}
        </TitledList>
        <TitledList {...listPropsHack('Well Plate')}>
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
        </TitledList>
        <TitledList {...listPropsHack('Trough')}>
          {[
            ['trough-12row', '12-row Trough', 'Trough-12row']
          ].map(labwareItemMapper)}
        </TitledList>
        {/* <TitledList title='PCR Strip'>
          {[
            ['PCR-strip-tall', 'PCR Strip Tall', '96-PCR-Strip']
          ].map(labwareItemMapper)}
        </TitledList> */}
        <TitledList {...listPropsHack('Trash')}>
          {[
            ['trash-box', 'Trash Box'] // no container img
          ].map(labwareItemMapper)}
        </TitledList>
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
