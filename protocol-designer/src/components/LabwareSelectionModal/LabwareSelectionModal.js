// @flow
import React, { useState, useMemo } from 'react'
import { useOnClickOutside, OutlineButton } from '@opentrons/components'
import { type DeckSlotId } from '@opentrons/shared-data'
import startCase from 'lodash/startCase'
import reduce from 'lodash/reduce'
import { getAllDefinitions } from '../../labware-defs/utils'
import { Portal } from '../portals/TopPortal'
import { PDTitledList } from '../lists'
import LabwareItem from './LabwareItem'
import LabwarePreview from './LabwarePreview'
import styles from './styles.css'

type Props = {
  onClose: (e?: *) => mixed,
  selectLabware: (containerType: string) => mixed,
  slot: ?DeckSlotId,
  permittedTipracks: Array<string>,
}

// TODO: BC 2019-05-10 ideally this should be pulled from the definitions
// and it's usage should be memoized by the useMemo below
const orderedCategories: Array<string> = [
  'tipRack',
  'tubeRack',
  'wellPlate',
  'trough',
  'trash',
]

const LabwareDropdown = (props: Props) => {
  const { permittedTipracks, onClose, slot, selectLabware } = props

  const [selectedCategory, selectCategory] = useState(null)
  const [previewedLabware, previewLabware] = useState(null)

  const labwareByCategory = useMemo(() => {
    const allDefs = getAllDefinitions()
    return reduce(
      allDefs,
      (acc, def) => {
        const category = def.metadata.displayCategory
        if (
          category === 'tipRack' &&
          !permittedTipracks.includes(def.parameters.loadName)
        ) {
          return acc
        }

        return {
          ...acc,
          [category]: [...(acc[category] || []), def],
        }
      },
      {}
    )
  }, [permittedTipracks])
  const wrapperRef = useOnClickOutside({ onClickOutside: onClose })

  // do not render without a slot
  if (!slot) return null

  const makeToggleCategory = (category: string) => () => {
    selectCategory(selectedCategory === category ? null : category)
  }

  return (
    <>
      <Portal>
        <LabwarePreview labwareDef={previewedLabware} />
      </Portal>
      <div ref={wrapperRef} className={styles.labware_dropdown}>
        <div className={styles.title}>Slot {slot} Labware</div>
        <ul>
          {orderedCategories.map(category => (
            <PDTitledList
              key={category}
              title={startCase(category)}
              collapsed={selectedCategory !== category}
              onCollapseToggle={makeToggleCategory(category)}
              onClick={makeToggleCategory(category)}
              className={styles.labware_selection_modal}
            >
              {labwareByCategory[category] &&
                labwareByCategory[category].map((labwareDef, index) => (
                  <LabwareItem
                    key={index}
                    containerType={labwareDef.parameters.loadName}
                    displayName={labwareDef.metadata.displayName}
                    selectLabware={selectLabware}
                    onMouseEnter={() => previewLabware(labwareDef)}
                    onMouseLeave={() => previewLabware()}
                  />
                ))}
            </PDTitledList>
          ))}
        </ul>
        <OutlineButton onClick={onClose}>CLOSE</OutlineButton>
      </div>
    </>
  )
}

export default LabwareDropdown
