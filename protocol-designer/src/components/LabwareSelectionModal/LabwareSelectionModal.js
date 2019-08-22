// @flow
import React, { useState, useMemo } from 'react'
import { useOnClickOutside, OutlineButton } from '@opentrons/components'
import {
  getLabwareDefURI,
  type DeckSlotId,
  type LabwareDefinition2,
} from '@opentrons/shared-data'
import startCase from 'lodash/startCase'
import reduce from 'lodash/reduce'
import i18n from '../../localization'
import { getOnlyLatestDefs } from '../../labware-defs/utils'
import { Portal } from '../portals/TopPortal'
import { PDTitledList } from '../lists'
import LabwareItem from './LabwareItem'
import LabwarePreview from './LabwarePreview'
import styles from './styles.css'
import type { LabwareDefByDefURI } from '../../labware-defs'

type Props = {
  onClose: (e?: *) => mixed,
  onUploadLabware: (event: SyntheticInputEvent<HTMLInputElement>) => mixed,
  selectLabware: (containerType: string) => mixed,
  customLabwareDefs: LabwareDefByDefURI,
  slot: ?DeckSlotId,
  permittedTipracks: Array<string>,
  showUploadCustomLabwareButton: ?boolean,
}

const CUSTOM_CATEGORY = 'custom'

const orderedCategories: Array<string> = [
  'tipRack',
  'tubeRack',
  'wellPlate',
  'reservoir',
  'aluminumBlock',
  // 'trash', // NOTE: trash intentionally hidden
]

const LabwareDropdown = (props: Props) => {
  const {
    customLabwareDefs,
    permittedTipracks,
    onClose,
    onUploadLabware,
    slot,
    selectLabware,
  } = props

  const [selectedCategory, selectCategory] = useState<?string>(null)
  const [previewedLabware, previewLabware] = useState<?LabwareDefinition2>(null)

  const customLabwareURIs: Array<string> = useMemo(
    () => Object.keys(customLabwareDefs),
    [customLabwareDefs]
  )

  const labwareByCategory = useMemo(() => {
    const defs = getOnlyLatestDefs()
    return reduce(
      defs,
      (acc, def: $Values<typeof defs>) => {
        const category = def.metadata.displayCategory
        // filter out non-permitted tipracks
        if (
          category === 'tipRack' &&
          !permittedTipracks.includes(getLabwareDefURI(def))
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
          {customLabwareURIs.length > 0 ? (
            <PDTitledList
              title="Custom Labware"
              collapsed={selectedCategory !== CUSTOM_CATEGORY}
              onCollapseToggle={makeToggleCategory(CUSTOM_CATEGORY)}
              onClick={makeToggleCategory(CUSTOM_CATEGORY)}
              className={styles.labware_selection_modal}
            >
              {customLabwareURIs.map((labwareURI, index) => (
                <LabwareItem
                  key={index}
                  labwareDef={customLabwareDefs[labwareURI]}
                  selectLabware={selectLabware}
                  onMouseEnter={() =>
                    previewLabware(customLabwareDefs[labwareURI])
                  }
                  onMouseLeave={() => previewLabware()}
                />
              ))}
            </PDTitledList>
          ) : null}
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
                    labwareDef={labwareDef}
                    selectLabware={selectLabware}
                    onMouseEnter={() => previewLabware(labwareDef)}
                    onMouseLeave={() => previewLabware()}
                  />
                ))}
            </PDTitledList>
          ))}
        </ul>
        {props.showUploadCustomLabwareButton && (
          <OutlineButton Component="label" className={styles.upload_button}>
            {i18n.t('button.upload_custom_labware')}
            <input
              type="file"
              onChange={e => {
                onUploadLabware(e)
                selectCategory(CUSTOM_CATEGORY)
              }}
            />
          </OutlineButton>
        )}
        <OutlineButton onClick={onClose}>
          {i18n.t('button.close')}
        </OutlineButton>
      </div>
    </>
  )
}

export default LabwareDropdown
