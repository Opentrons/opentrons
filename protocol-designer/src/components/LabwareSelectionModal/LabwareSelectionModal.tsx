import * as React from 'react'
import startCase from 'lodash/startCase'
import reduce from 'lodash/reduce'
import {
  useOnClickOutside,
  DeprecatedCheckboxField,
  Icon,
  OutlineButton,
} from '@opentrons/components'
import {
  getLabwareDefURI,
  getLabwareDefIsStandard,
  getIsLabwareAboveHeight,
  TEMPERATURE_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
  MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM,
  LabwareDefinition2,
  ModuleType,
} from '@opentrons/shared-data'
import { i18n } from '../../localization'
import { SPAN7_8_10_11_SLOT } from '../../constants'
import { getLabwareIsCompatible as _getLabwareIsCompatible } from '../../utils/labwareModuleCompatibility'
import { getOnlyLatestDefs } from '../../labware-defs/utils'
import { Portal } from '../portals/TopPortal'
import { PDTitledList } from '../lists'
import { useBlockingHint } from '../Hints/useBlockingHint'
import { KnowledgeBaseLink } from '../KnowledgeBaseLink'
import { LabwareItem } from './LabwareItem'
import { LabwarePreview } from './LabwarePreview'
import styles from './styles.css'
import { DeckSlot } from '../../types'
import { LabwareDefByDefURI } from '../../labware-defs'

export interface Props {
  onClose: (e?: any) => unknown
  onUploadLabware: (event: React.ChangeEvent<HTMLInputElement>) => unknown
  selectLabware: (containerType: string) => unknown
  customLabwareDefs: LabwareDefByDefURI
  /** the slot you're literally adding labware to (may be a module slot) */
  slot?: DeckSlot | null
  /** if adding to a module, the slot of the parent (for display) */
  parentSlot?: DeckSlot | null
  /** if adding to a module, the module's type */
  moduleType?: ModuleType | null
  /** tipracks that may be added to deck (depends on pipette<>tiprack assignment) */
  permittedTipracks: string[]
  isNextToHeaterShaker: boolean
}

const LABWARE_CREATOR_URL = 'https://labware.opentrons.com/create'
const CUSTOM_CATEGORY = 'custom'

const orderedCategories: string[] = [
  'tipRack',
  'tubeRack',
  'wellPlate',
  'reservoir',
  'aluminumBlock',
  // 'trash', // NOTE: trash intentionally hidden
]

const RECOMMENDED_LABWARE_BY_MODULE: { [K in ModuleType]: string[] } = {
  [TEMPERATURE_MODULE_TYPE]: [
    'opentrons_24_aluminumblock_generic_2ml_screwcap',
    'opentrons_96_aluminumblock_biorad_wellplate_200ul',
    'opentrons_96_aluminumblock_generic_pcr_strip_200ul',
    'opentrons_24_aluminumblock_nest_1.5ml_screwcap',
    'opentrons_24_aluminumblock_nest_1.5ml_snapcap',
    'opentrons_24_aluminumblock_nest_2ml_screwcap',
    'opentrons_24_aluminumblock_nest_2ml_snapcap',
    'opentrons_24_aluminumblock_nest_0.5ml_screwcap',
    'opentrons_96_aluminumblock_nest_wellplate_100ul',
  ],
  [MAGNETIC_MODULE_TYPE]: ['nest_96_wellplate_100ul_pcr_full_skirt'],
  [THERMOCYCLER_MODULE_TYPE]: ['nest_96_wellplate_100ul_pcr_full_skirt'],
  [HEATERSHAKER_MODULE_TYPE]: [
    'opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep',
    'opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat',
    'opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt',
    'opentrons_universal_flat_adapter_corning_384_wellplate_112ul_flat',
  ],
  [MAGNETIC_BLOCK_TYPE]: [
    'armadillo_96_wellplate_200ul_pcr_full_skirt',
    'nest_96_wellplate_100ul_pcr_full_skirt',
  ],
}

export const getLabwareIsRecommended = (
  def: LabwareDefinition2,
  moduleType?: ModuleType | null
): boolean =>
  moduleType
    ? RECOMMENDED_LABWARE_BY_MODULE[moduleType].includes(
        def.parameters.loadName
      )
    : false

export const LabwareSelectionModal = (props: Props): JSX.Element | null => {
  const {
    customLabwareDefs,
    permittedTipracks,
    onClose,
    onUploadLabware,
    slot,
    parentSlot,
    moduleType,
    selectLabware,
    isNextToHeaterShaker,
  } = props

  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  )
  const [previewedLabware, setPreviewedLabware] = React.useState<
    LabwareDefinition2 | null | undefined
  >(null)
  const [filterRecommended, setFilterRecommended] = React.useState<boolean>(
    false
  )
  const [filterHeight, setFilterHeight] = React.useState<boolean>(false)
  const [enqueuedLabwareType, setEnqueuedLabwareType] = React.useState<
    string | null
  >(null)
  const blockingCustomLabwareHint = useBlockingHint({
    enabled: enqueuedLabwareType !== null,
    hintKey: 'custom_labware_with_modules',
    content: <p>{i18n.t(`alert.hint.custom_labware_with_modules.body`)}</p>,
    handleCancel: () => setEnqueuedLabwareType(null),
    handleContinue: () => {
      setEnqueuedLabwareType(null)
      if (enqueuedLabwareType !== null) {
        // NOTE: this needs to be wrapped for Flow, IRL we know enqueuedLabwareType is not null
        // because `enabled` prop above ensures it's !== null.
        selectLabware(enqueuedLabwareType)
      } else {
        console.error(
          'could not select labware because enqueuedLabwareType is null. This should not happen'
        )
      }
    },
  })

  const handleSelectCustomLabware = React.useCallback(
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
  React.useEffect(() => {
    setFilterRecommended(moduleType != null)
    setFilterHeight(isNextToHeaterShaker)
  }, [moduleType, isNextToHeaterShaker])

  const getLabwareCompatible = React.useCallback(
    (def: LabwareDefinition2) => {
      // assume that custom (non-standard) labware is (potentially) compatible
      if (moduleType == null || !getLabwareDefIsStandard(def)) {
        return true
      }
      return _getLabwareIsCompatible(def, moduleType)
    },
    [moduleType]
  )

  const getIsLabwareFiltered = React.useCallback(
    (labwareDef: LabwareDefinition2) =>
      (filterRecommended && !getLabwareIsRecommended(labwareDef, moduleType)) ||
      (filterHeight &&
        getIsLabwareAboveHeight(
          labwareDef,
          MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM
        )) ||
      !getLabwareCompatible(labwareDef),
    [filterRecommended, filterHeight, getLabwareCompatible, moduleType]
  )

  const getTitleText = (): string => {
    if (isNextToHeaterShaker) {
      return `Slot ${slot}, Labware to the side of ${i18n.t(
        `modules.module_long_names.heaterShakerModuleType`
      )}`
    }
    if (parentSlot != null && moduleType != null) {
      return `Slot ${
        parentSlot === SPAN7_8_10_11_SLOT ? '7' : parentSlot
      }, ${i18n.t(`modules.module_long_names.${moduleType}`)} Labware`
    }
    return `Slot ${slot} Labware`
  }

  const customLabwareURIs: string[] = React.useMemo(
    () => Object.keys(customLabwareDefs),
    [customLabwareDefs]
  )

  const labwareByCategory = React.useMemo(() => {
    const defs = getOnlyLatestDefs()
    return reduce<
      LabwareDefByDefURI,
      { [category: string]: LabwareDefinition2[] }
    >(
      defs,
      (acc, def: typeof defs[keyof typeof defs]) => {
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

  const populatedCategories: { [category: string]: boolean } = React.useMemo(
    () =>
      orderedCategories.reduce(
        (acc, category) =>
          labwareByCategory[category]
            ? {
                ...acc,
                [category]: labwareByCategory[category].some(
                  def => !getIsLabwareFiltered(def)
                ),
              }
            : acc,
        {}
      ),
    [labwareByCategory, getIsLabwareFiltered]
  )

  const wrapperRef: React.RefObject<HTMLDivElement> = useOnClickOutside({
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

  const getFilterCheckbox = (): JSX.Element | null => {
    if (isNextToHeaterShaker || moduleType != null) {
      return (
        <div>
          <div className={styles.filters_heading}>Filters</div>
          <div className={styles.filters_section}>
            <DeprecatedCheckboxField
              className={styles.filter_checkbox}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                isNextToHeaterShaker
                  ? setFilterHeight(e.currentTarget.checked)
                  : setFilterRecommended(e.currentTarget.checked)
              }
              value={isNextToHeaterShaker ? filterHeight : filterRecommended}
            />
            {isNextToHeaterShaker && (
              <Icon className={styles.icon} name="check-decagram" />
            )}
            <span className={styles.filters_section_copy}>
              {i18n.t(
                isNextToHeaterShaker
                  ? 'modal.labware_selection.heater_shaker_labware_filter'
                  : 'modal.labware_selection.recommended_labware_filter'
              )}{' '}
              <KnowledgeBaseLink
                className={styles.link}
                to={
                  isNextToHeaterShaker
                    ? 'heaterShakerLabware'
                    : 'recommendedLabware'
                }
              >
                here
              </KnowledgeBaseLink>
              .
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  let moduleCompatibility: React.ComponentProps<
    typeof LabwarePreview
  >['moduleCompatibility'] = null
  if (previewedLabware && moduleType) {
    if (getLabwareIsRecommended(previewedLabware, moduleType)) {
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
        <div className={styles.title}>{getTitleText()}</div>
        {getFilterCheckbox()}
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
                  // @ts-expect-error(sa, 2021-6-22): need to pass in a nullsy value
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
                  {labwareByCategory[category]?.map((labwareDef, index) => {
                    const isFiltered = getIsLabwareFiltered(labwareDef)
                    if (!isFiltered) {
                      return (
                        <LabwareItem
                          key={index}
                          icon={
                            getLabwareIsRecommended(labwareDef, moduleType)
                              ? 'check-decagram'
                              : null
                          }
                          labwareDef={labwareDef}
                          selectLabware={selectLabware}
                          onMouseEnter={() => setPreviewedLabware(labwareDef)}
                          // @ts-expect-error(sa, 2021-6-22): setPreviewedLabware expects an argument (even if nullsy)
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
