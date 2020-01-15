// @flow
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ElementProps,
} from 'react'
import startCase from 'lodash/startCase'
import reduce from 'lodash/reduce'
import {
  useOnClickOutside,
  CheckboxField,
  Icon,
  OutlineButton,
} from '@opentrons/components'
import {
  getLabwareDefURI,
  getLabwareDefIsStandard,
  type LabwareDefinition2,
  type ModuleType,
} from '@opentrons/shared-data'
import i18n from '../../localization'
import { SPAN7_8_10_11_SLOT } from '../../constants'
import { getLabwareIsCompatible as _getLabwareIsCompatible } from '../../utils/labwareModuleCompatibility'
import { getOnlyLatestDefs } from '../../labware-defs/utils'
import { Portal } from '../portals/TopPortal'
import { PDTitledList } from '../lists'
import useBlockingHint from '../Hints/useBlockingHint'
import KnowledgeBaseLink from '../KnowledgeBaseLink'
import LabwareItem from './LabwareItem'
import LabwarePreview from './LabwarePreview'
import styles from './styles.css'
import type { DeckSlot } from '../../types'
import type { LabwareDefByDefURI } from '../../labware-defs'

type Props = {|
  onClose: (e?: any) => mixed,
  onUploadLabware: (event: SyntheticInputEvent<HTMLInputElement>) => mixed,
  selectLabware: (containerType: string) => mixed,
  customLabwareDefs: LabwareDefByDefURI,
  /** the slot you're literally adding labware to (may be a module slot) */
  slot: ?DeckSlot,
  /** if adding to a module, the slot of the parent (for display) */
  parentSlot: ?DeckSlot,
  /** if adding to a module, the module's type */
  moduleType: ?ModuleType,
  /** tipracks that may be added to deck (depends on pipette<>tiprack assignment) */
  permittedTipracks: Array<string>,
|}

const LABWARE_CREATOR_URL = 'https://labware.opentrons.com/create'
const CUSTOM_CATEGORY = 'custom'

const orderedCategories: Array<string> = [
  'tipRack',
  'tubeRack',
  'wellPlate',
  'reservoir',
  'aluminumBlock',
  // 'trash', // NOTE: trash intentionally hidden
]

const RECOMMENDED_LABWARE_BY_MODULE: { [ModuleType]: Array<string> } = {
  tempdeck: [
    'opentrons_24_aluminumblock_generic_2ml_screwcap',
    'opentrons_96_aluminumblock_biorad_wellplate_200ul',
    'opentrons_96_aluminumblock_generic_pcr_strip_200ul',
    'opentrons_24_aluminumblock_nest_1.5ml_screwcap',
    'opentrons_24_aluminumblock_nest_1.5ml_snapcap',
    'opentrons_24_aluminumblock_nest_2ml_screwcap',
    'opentrons_24_aluminumblock_nest_2ml_snapcap',
    'opentrons_24_aluminumblock_nest_0.5ml_screwcap',
  ],
  magdeck: ['biorad_96_wellplate_200ul_pcr'],
  thermocycler: ['nest_96_wellplate_100ul_pcr_full_skirt'],
}

const LabwareSelectionModal = (props: Props) => {
  const {
    customLabwareDefs,
    permittedTipracks,
    onClose,
    onUploadLabware,
    slot,
    parentSlot,
    moduleType,
    selectLabware,
  } = props

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [previewedLabware, setPreviewedLabware] = useState<?LabwareDefinition2>(
    null
  )
  const [filterRecommended, setFilterRecommended] = useState<boolean>(false)
  const [enqueuedLabwareType, setEnqueuedLabwareType] = useState<string | null>(
    null
  )
  const blockingCustomLabwareHint = useBlockingHint({
    enabled: enqueuedLabwareType !== null,
    hintKey: 'custom_labware_with_modules',
    handleCancel: () => setEnqueuedLabwareType(null),
    handleContinue: () => {
      if (enqueuedLabwareType) {
        setEnqueuedLabwareType(null)
        selectLabware(enqueuedLabwareType)
      }
    },
  })

  const handleSelectCustomLabware = useCallback(
    (containerType: string) => {
      if (moduleType == null) {
        selectLabware(containerType)
      } else {
        // show the BlockingHint
        setEnqueuedLabwareType(containerType)
      }
    },
    [moduleType, selectLabware, setEnqueuedLabwareType]
  )

  // if you're adding labware to a module, check the recommended filter by default
  useEffect(() => {
    setFilterRecommended(moduleType != null)
  }, [moduleType])

  const getLabwareRecommended = useCallback(
    (def: LabwareDefinition2) => {
      return (
        moduleType &&
        RECOMMENDED_LABWARE_BY_MODULE[moduleType].includes(
          def.parameters.loadName
        )
      )
    },
    [moduleType]
  )

  const getLabwareCompatible = useCallback(
    (def: LabwareDefinition2) => {
      // assume that custom (non-standard) labware is (potentially) compatible
      if (moduleType == null || !getLabwareDefIsStandard(def)) {
        return true
      }
      return _getLabwareIsCompatible(def, moduleType)
    },
    [moduleType]
  )

  const getLabwareDisabled = useCallback(
    (labwareDef: LabwareDefinition2) =>
      (filterRecommended && !getLabwareRecommended(labwareDef)) ||
      !getLabwareCompatible(labwareDef),
    [filterRecommended, getLabwareCompatible, getLabwareRecommended]
  )

  const customLabwareURIs: Array<string> = useMemo(
    () => Object.keys(customLabwareDefs),
    [customLabwareDefs]
  )

  const labwareByCategory = useMemo(() => {
    const defs = getOnlyLatestDefs()
    return reduce<
      LabwareDefByDefURI,
      { [category: string]: Array<LabwareDefinition2> }
    >(
      defs,
      (acc, def: $Values<typeof defs>) => {
        const category: string = def.metadata.displayCategory
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

  const populatedCategories: { [category: string]: boolean } = useMemo(
    () =>
      orderedCategories.reduce(
        (acc, category) => ({
          ...acc,
          [category]: labwareByCategory[category].some(
            def => !getLabwareDisabled(def)
          ),
        }),
        {}
      ),
    [labwareByCategory, getLabwareDisabled]
  )

  const wrapperRef = useOnClickOutside({
    onClickOutside: () => {
      // don't close when clicking on the custom labware hint
      if (!enqueuedLabwareType) {
        onClose()
      }
    },
  })

  // do not render without a slot
  if (!slot) return null

  const makeToggleCategory = (category: string) => () => {
    setSelectedCategory(selectedCategory === category ? null : category)
  }

  const recommendedFilterCheckbox = moduleType ? (
    <div>
      <div className={styles.filters_heading}>Filters</div>
      <div className={styles.filters_section}>
        <CheckboxField
          className={styles.filter_checkbox}
          onChange={e => setFilterRecommended(e.currentTarget.checked)}
          value={filterRecommended}
        />
        <Icon className={styles.icon} name="check-decagram" />
        <span className={styles.filters_section_copy}>
          {i18n.t('modal.labware_selection.recommended_labware_filter')}{' '}
          <KnowledgeBaseLink className={styles.link} to="recommendedLabware">
            here
          </KnowledgeBaseLink>
          .
        </span>
      </div>
    </div>
  ) : null

  let moduleCompatibility: $PropertyType<
    ElementProps<typeof LabwarePreview>,
    'moduleCompatibility'
  > = null
  if (previewedLabware && moduleType) {
    if (getLabwareRecommended(previewedLabware)) {
      moduleCompatibility = 'recommended'
    } else if (getLabwareCompatible(previewedLabware)) {
      moduleCompatibility = 'potentiallyCompatible'
    } else {
      moduleCompatibility = 'notCompatible'
    }
  }

  return (
    <>
      <Portal>
        <LabwarePreview
          labwareDef={previewedLabware}
          moduleCompatibility={moduleCompatibility}
        />
      </Portal>
      {blockingCustomLabwareHint}
      <div ref={wrapperRef} className={styles.labware_dropdown}>
        <div className={styles.title}>
          {parentSlot != null && moduleType != null
            ? `Slot ${
                parentSlot === SPAN7_8_10_11_SLOT ? '7' : parentSlot
              }, ${i18n.t(`modules.module_long_names.${moduleType}`)} Labware`
            : `Slot ${slot} Labware`}
        </div>
        {recommendedFilterCheckbox}
        <ul>
          {customLabwareURIs.length > 0 ? (
            <PDTitledList
              title="Custom Labware"
              collapsed={selectedCategory !== CUSTOM_CATEGORY}
              onCollapseToggle={makeToggleCategory(CUSTOM_CATEGORY)}
              onClick={makeToggleCategory(CUSTOM_CATEGORY)}
            >
              {customLabwareURIs.map((labwareURI, index) => (
                <LabwareItem
                  key={index}
                  labwareDef={customLabwareDefs[labwareURI]}
                  selectLabware={handleSelectCustomLabware}
                  onMouseEnter={() =>
                    setPreviewedLabware(customLabwareDefs[labwareURI])
                  }
                  onMouseLeave={() => setPreviewedLabware()}
                />
              ))}
            </PDTitledList>
          ) : null}
          {orderedCategories.map(category => {
            const isPopulated = populatedCategories[category]
            if (isPopulated) {
              return (
                <PDTitledList
                  key={category}
                  title={startCase(category)}
                  collapsed={selectedCategory !== category}
                  onCollapseToggle={makeToggleCategory(category)}
                  onClick={makeToggleCategory(category)}
                  inert={!isPopulated}
                >
                  {labwareByCategory[category] &&
                    labwareByCategory[category].map((labwareDef, index) => {
                      const isDisabled = getLabwareDisabled(labwareDef)
                      if (!isDisabled) {
                        return (
                          <LabwareItem
                            key={index}
                            icon={
                              getLabwareRecommended(labwareDef)
                                ? 'check-decagram'
                                : null
                            }
                            disabled={isDisabled}
                            labwareDef={labwareDef}
                            selectLabware={selectLabware}
                            onMouseEnter={() => setPreviewedLabware(labwareDef)}
                            onMouseLeave={() => setPreviewedLabware()}
                          />
                        )
                      }
                    })}
                </PDTitledList>
              )
            }
          })}
        </ul>

        <OutlineButton Component="label" className={styles.upload_button}>
          {i18n.t('button.upload_custom_labware')}
          <input
            type="file"
            onChange={e => {
              onUploadLabware(e)
              setSelectedCategory(CUSTOM_CATEGORY)
            }}
          />
        </OutlineButton>
        <div className={styles.upload_helper_copy}>
          {i18n.t('modal.labware_selection.creating_labware_defs')}{' '}
          {/* TODO: Ian 2019-10-15 use LinkOut component once it's in components library, see Opentrons/opentrons#4229 */}
          <a
            className={styles.link}
            href={LABWARE_CREATOR_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </a>
          .
        </div>

        <OutlineButton onClick={onClose}>
          {i18n.t('button.close')}
        </OutlineButton>
      </div>
    </>
  )
}

export default LabwareSelectionModal
