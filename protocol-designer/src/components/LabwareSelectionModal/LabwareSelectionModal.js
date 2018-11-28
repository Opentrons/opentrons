// @flow
import * as React from 'react'
import {getLabwareDiagramURL} from '../../images'
import {
  ClickOutside,
  OutlineButton,
  type DeckSlot,
} from '@opentrons/components'
import {PDTitledList} from '../lists'
import SelectedWrapper from './SelectedWrapper'
import LabwareItem from './LabwareItem'
import styles from './styles.css'

type Props = {
  onClose: (e?: *) => mixed,
  selectLabware: (containerType: string) => mixed,
  slot: ?DeckSlot,
  permittedTipracks: Array<string>,
  select: (?string) => mixed,
  selectedSection: ?string,
}

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
    ['opentrons-aluminum-block-2ml-eppendorf', 'Aluminum Block - 2mL Eppendorf Tubes'],
    ['opentrons-aluminum-block-2ml-screwcap', 'Aluminum Block - 2mL Screw Cap Tubes'],
    ['opentrons-aluminum-block-96-PCR-plate', 'Aluminum Block - 96 PCR Plate'],
    ['opentrons-aluminum-block-PCR-strips-200ul', 'Aluminum Block - 0.2mL PCR Strips'],
  ],
  'Tube Rack': [
    ['opentrons-tuberack-1.5ml-eppendorf', '1.5mL Tube Rack (4-in-1 Rack)'],
    ['opentrons-tuberack-2ml-eppendorf', '2mL Eppendorf Tube Rack (4-in-1 Rack)'],
    ['opentrons-tuberack-2ml-screwcap', '2mL Screw Cap Tube Rack (4-in-1 Rack)'],
    ['opentrons-tuberack-15ml', '15mL Tube Rack (4-in-1 Rack)'],
    ['opentrons-tuberack-50ml', '50mL Tube Rack (4-in-1 Rack)'],
    ['opentrons-tuberack-15_50ml', '15mL x 6 + 50mL x 4 Tube Rack (4-in-1 Rack)', 'Opentrons-4-in-1-tuberack-15-50'],
    ['tube-rack-.75ml', '0.75mL Tube Rack (Clear Acrylic)', 'Tuberack-075ml'],
    ['tube-rack-2ml', '2mL Tube Rack (Clear Acrylic)', 'Tuberack-2ml'],
    ['tube-rack-15_50ml', '15mL x 6 + 50mL x 4 Tube Rack (Clear Acrylic)', 'Tuberack-15-50ml'],
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
  'Trough': [
    ['trough-12row', '12-row Trough', 'Trough-12row'],
  ],
  'Trash': [
    ['trash-box', 'Trash Box'], // no container img
  ],
}

const labwareSectionOrder: Array<$Keys<typeof hardcodedLabware>> = [
  'Tip Rack',
  'Aluminum Block',
  'Tube Rack',
  'Well Plate',
  'Trough',
  'Trash',
]

class LabwareDropdown extends React.Component <Props> {
  labwareItemMapper = (dataRow, key) => {
    const {selectLabware} = this.props
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

  generateSections = () => {
    const {permittedTipracks, selectedSection, select} = this.props

    const sections = labwareSectionOrder.map(section => {
      const selectSection = () => select(section)
      let labwareInSection = hardcodedLabware[section]

      if (section === 'Tip Rack') {
        // filter out tip rack labware that doesn't match pipettes
        labwareInSection = labwareInSection.filter(labwareModelNameImage =>
          permittedTipracks.includes(labwareModelNameImage[0])
        )
      }

      return (
        <PDTitledList
          key={section}
          title={section}
          collapsed={selectedSection !== section}
          onCollapseToggle={selectSection}
          onClick={selectSection}
          className={styles.labware_selection_modal}
        >
          {labwareInSection.map(this.labwareItemMapper)}
        </PDTitledList>
      )
    })

    return sections
  }

  render () {
    const {onClose, slot} = this.props
    // do not render without a slot
    if (!slot) return null

    return (
      <ClickOutside onClickOutside={onClose}>
        {({ref}) => (
          <div ref={ref} className={styles.labware_dropdown}>
            <div className={styles.title}>Slot {slot} Labware</div>
            <ul>
              {this.generateSections()}
            </ul>
            <OutlineButton onClick={onClose}>CLOSE</OutlineButton>
          </div>
        )}
      </ClickOutside>
    )
  }
}

type FinalProps = $Diff<Props, {selectedSection: *, select: *}>

export default function WrappedLabwareDropdown (props: FinalProps) {
  return <SelectedWrapper render={({selected, select}) =>
    <LabwareDropdown {...{...props, selectedSection: selected, select}}/>} />
}
