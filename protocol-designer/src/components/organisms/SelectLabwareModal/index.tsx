import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import reduce from 'lodash/reduce'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  CheckboxField,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DISPLAY_INLINE_BLOCK,
  Flex,
  InfoScreen,
  InlineNotification,
  InputField,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getAreSlotsHorizontallyAdjacent,
  getIsLabwareAboveHeight,
  getLabwareDefIsStandard,
  getLabwareDefURI,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { LINK_BUTTON_STYLE } from '../../../components/atoms'
import { getEnableStacking } from '../../../feature-flags/selectors'
import { getRobotType } from '../../../file-data/selectors'
import { getOnlyLatestDefs } from '../../../labware-defs'
import { createCustomLabwareDef } from '../../../labware-defs/actions'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import { selectors } from '../../../labware-ingred/selectors'
import {
  ALL_ORDERED_CATEGORIES,
  CUSTOM_CATEGORY,
} from '../../../pages/Designer/DeckSetup/constants'
import { getLabwareIsRecommended } from '../../../pages/Designer/DeckSetup/utils'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { getPipetteEntities } from '../../../step-forms/selectors'
import { getHas96Channel } from '../../../utils'
import {
  ADAPTER_96_CHANNEL,
  getLabwareCompatibleWithModule,
} from '../../../utils/labwareModuleCompatibility'
import { getMainPagePortalEl } from '../Portal'
import { SelectCustomLabware } from './SelectCustomLabware'
import { SelectLabware } from './SelectLabware'

import type { ChangeEvent } from 'react'
import type { DeckSlotId, LabwareDefinition2 } from '@opentrons/shared-data'
import type { LabwareDefByDefURI } from '../../../labware-defs'
import type { CategoryExpand } from '../../../pages/Designer/DeckSetup/DeckSetupToolbox'
import type { ModuleOnDeck } from '../../../step-forms'
import type { ThunkDispatch } from '../../../types'

const STANDARD_X_DIMENSION = 127.75
const STANDARD_Y_DIMENSION = 85.48
const STACKING_LOADNAMES = [
  'opentrons_flex_deck_riser',
  'opentrons_flex_tiprack_lid',
  'opentrons_tough_pcr_auto_sealing_lid',
]
const PLATE_READER_LOADNAME =
  'opentrons_flex_lid_absorbance_plate_reader_module'
const UNIVERSAL_LID_LOADNAME = 'opentrons_tough_universal_lid'

interface SelectLabwareModalProps {
  slot: DeckSlotId
  onClose: () => void
  onConfirm: () => void
  slotFull: boolean
}

export interface LabwareInfo {
  uri: string
  def: LabwareDefinition2
}

export function SelectLabwareModal(
  props: SelectLabwareModalProps
): JSX.Element {
  const { slot, onClose, onConfirm, slotFull } = props
  const { t } = useTranslation(['starting_deck_state', 'shared'])
  const robotType = useSelector(getRobotType)
  const [error, setError] = useState<string | null>(null)

  const dispatch = useDispatch<ThunkDispatch<any>>()
  const enableStacking = useSelector(getEnableStacking)
  const permittedTipracks = useSelector(stepFormSelectors.getPermittedTipracks)
  const pipetteEntities = useSelector(getPipetteEntities)
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const has96Channel = getHas96Channel(pipetteEntities)
  const defs = getOnlyLatestDefs()
  const universalLid = Object.entries(defs).find(
    ([id, def]) => def.parameters.loadName === UNIVERSAL_LID_LOADNAME
  )
  const deckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
  const zoomedInSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const {
    selectedTopLabware,
    selectedModuleModel,
    selectedAdapterDefURI,
  } = zoomedInSlotInfo

  const hasNoLabware =
    selectedTopLabware == null && selectedAdapterDefURI == null
  const createCategoryState = (state: boolean): Record<string, boolean> =>
    Object.fromEntries(ALL_ORDERED_CATEGORIES.map(cat => [cat, state]))

  const allCategoriesExpanded = useMemo(() => createCategoryState(true), [])
  const allCategoriesCollapsed = useMemo(() => createCategoryState(false), [])

  const [
    areCategoriesExpanded,
    setAreCategoriesExpanded,
  ] = useState<CategoryExpand>(allCategoriesCollapsed)

  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    setAreCategoriesExpanded(
      searchTerm ? allCategoriesExpanded : allCategoriesCollapsed
    )
  }, [searchTerm, allCategoriesExpanded, allCategoriesCollapsed])

  useEffect(() => {
    if (!hasNoLabware && error != null) {
      setError(null)
    }
  }, [hasNoLabware])

  const handleResetLabwareTools = (): void => {
    setAreCategoriesExpanded(allCategoriesCollapsed)
    setSearchTerm('')
  }

  const searchFilter = (termToCheck: string): boolean =>
    termToCheck.toLowerCase().includes(searchTerm.toLowerCase())

  const modulesById = deckSetup.modules
  const moduleType =
    selectedModuleModel != null ? getModuleType(selectedModuleModel) : null
  const onFlexStacker = moduleType === FLEX_STACKER_MODULE_TYPE
  const initialModules: ModuleOnDeck[] = Object.keys(modulesById).map(
    moduleId => modulesById[moduleId]
  )
  const [filterRecommended, setFilterRecommended] = useState<boolean>(
    moduleType != null
  )
  //    for OT-2 usage only due to H-S collisions
  const isNextToHeaterShaker = initialModules.some(
    hardwareModule =>
      hardwareModule.type === HEATERSHAKER_MODULE_TYPE &&
      getAreSlotsHorizontallyAdjacent(hardwareModule.slot, slot)
  )
  const [filterHeight, setFilterHeight] = useState<boolean>(
    robotType === OT2_ROBOT_TYPE ? isNextToHeaterShaker : false
  )

  const getIsLabwareCompatible = useCallback(
    (def: LabwareDefinition2) => {
      // assume that custom (non-standard) labware is (potentially) compatible
      if (moduleType == null || !getLabwareDefIsStandard(def)) {
        return true
      }
      return getLabwareCompatibleWithModule(def, moduleType)
    },
    [moduleType]
  )

  const getIsLabwareFiltered = useCallback(
    (labwareDef: LabwareDefinition2) => {
      const { dimensions, parameters } = labwareDef
      const { xDimension, yDimension } = dimensions

      const isSmallXDimension = xDimension < STANDARD_X_DIMENSION
      const isSmallYDimension = yDimension < STANDARD_Y_DIMENSION
      const isIrregularSize = isSmallXDimension && isSmallYDimension
      const isAdapter = labwareDef.allowedRoles?.includes('adapter')
      const isAdapter96Channel = parameters.loadName === ADAPTER_96_CHANNEL
      return (
        (filterRecommended &&
          !getLabwareIsRecommended(labwareDef, selectedModuleModel)) ||
        (filterHeight &&
          getIsLabwareAboveHeight(
            labwareDef,
            MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM
          )) ||
        !getIsLabwareCompatible(labwareDef) ||
        (isAdapter &&
          isIrregularSize &&
          moduleType !== HEATERSHAKER_MODULE_TYPE) ||
        (isAdapter96Channel && !has96Channel) ||
        (slot === 'offDeck' && isAdapter) ||
        (PLATE_READER_LOADNAME === parameters.loadName &&
          moduleType !== ABSORBANCE_READER_TYPE) ||
        (!enableStacking && STACKING_LOADNAMES.includes(parameters.loadName))
      )
    },
    [filterRecommended, filterHeight, getIsLabwareCompatible, moduleType, slot]
  )

  const labwareByCategory = useMemo(() => {
    return reduce<
      LabwareDefByDefURI,
      { [category: string]: LabwareDefinition2[] }
    >(
      defs,
      (acc, def: typeof defs[keyof typeof defs]) => {
        const category: string = def.metadata.displayCategory
        //  filter out non-permitted tipracks
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

  const filteredLabwareByCategory: Record<string, LabwareInfo[]> = useMemo(
    () =>
      ALL_ORDERED_CATEGORIES.reduce((acc, category) => {
        if (category === 'custom') {
          return {
            ...acc,
            [category]: filterRecommended
              ? []
              : Object.entries(customLabwareDefs).reduce<LabwareInfo[]>(
                  (accInner, [uri, def]) => {
                    return searchFilter(def.metadata.displayName)
                      ? [...accInner, { uri, def }]
                      : accInner
                  },
                  []
                ),
          }
        }
        const isDeckLocationCategory =
          slot === 'offDeck' ? category !== 'adapter' : true
        if (!(category in labwareByCategory) || !isDeckLocationCategory) {
          return { ...acc, [category]: [] }
        }
        return {
          ...acc,
          [category]: labwareByCategory[category].reduce<LabwareInfo[]>(
            (accInner, def) => {
              return searchFilter(def.metadata.displayName) &&
                !getIsLabwareFiltered(def)
                ? [...accInner, { def, uri: getLabwareDefURI(def) }]
                : accInner
            },
            []
          ),
        }
      }, {}),
    [labwareByCategory, getIsLabwareFiltered, searchTerm]
  )

  const handleCategoryClick = (category: string, expand?: boolean): void => {
    const updatedExpandState = {
      ...areCategoriesExpanded,
      [category]: expand ?? !areCategoriesExpanded[category],
    }
    setAreCategoriesExpanded(updatedExpandState)
  }

  const handleAddLabwareClick = (): void => {
    if (slotFull) {
      setError(t('no_space') as string)
      return
    }
    if (hasNoLabware) {
      setError(t('select_before_proceeding') as string)
    } else {
      onConfirm()
      handleResetLabwareTools()
    }
  }

  return createPortal(
    <Modal
      marginLeft="0"
      title={t('add_labware')}
      type="info"
      width="37.125rem"
      onClose={() => {
        onClose()
        handleResetLabwareTools()
      }}
      footer={
        <Flex
          flexDirection={DIRECTION_COLUMN}
          padding={`0 ${SPACING.spacing24} ${SPACING.spacing24} ${SPACING.spacing24}`}
          gridGap="36px"
        >
          {!slotFull ? (
            <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_CENTER}>
              <StyledLabel css={LINK_BUTTON_STYLE}>
                <StyledText desktopStyle="bodyDefaultRegular">
                  {t('upload_custom_labware')}
                </StyledText>
                <input
                  data-testid="customLabwareInput"
                  type="file"
                  onChange={e => {
                    dispatch(createCustomLabwareDef(e))
                    handleCategoryClick(CUSTOM_CATEGORY, true)
                  }}
                />
              </StyledLabel>
            </Flex>
          ) : null}
          <Flex justifyContent={JUSTIFY_END} gridGap={SPACING.spacing8}>
            {error != null && (
              <InlineNotification type="error" heading={error} hug />
            )}
            <SecondaryButton
              onClick={() => {
                onClose()
                handleResetLabwareTools()
              }}
            >
              {t('shared:cancel')}
            </SecondaryButton>
            <PrimaryButton
              data-testid="SelectLabwareModal_confirm"
              onClick={handleAddLabwareClick}
            >
              {t('add_labware')}
            </PrimaryButton>
          </Flex>
        </Flex>
      }
    >
      <Flex
        paddingTop={SPACING.spacing8}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <InputField
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value)
            }}
            placeholder={t('search_labware')}
            size="medium"
            leftIcon="search"
            showDeleteIcon
            onDelete={() => {
              setSearchTerm('')
            }}
          />
          {moduleType != null ||
          (isNextToHeaterShaker && robotType === OT2_ROBOT_TYPE) ? (
            <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
              <CheckboxField
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  isNextToHeaterShaker
                    ? setFilterHeight(e.currentTarget.checked)
                    : setFilterRecommended(e.currentTarget.checked)
                }}
                value={
                  isNextToHeaterShaker && robotType === OT2_ROBOT_TYPE
                    ? filterHeight
                    : filterRecommended
                }
              />
              <StyledText desktopStyle="captionRegular">
                {t('only_display_rec')}
              </StyledText>
            </Flex>
          ) : null}
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing4}
          overflowY="scroll"
          maxHeight="15.5rem"
          paddingTop={SPACING.spacing8}
        >
          <SelectCustomLabware
            slot={slot}
            handleCategoryClick={handleCategoryClick}
            areCategoriesExpanded={areCategoriesExpanded}
            onFlexStacker={onFlexStacker}
            filteredLabwareByCategory={filteredLabwareByCategory}
            universalLid={universalLid}
          />
          {slotFull ? (
            <InfoScreen
              content={t('remove_existing_labware')}
              subContent={t('labware_already_in_slot')}
            />
          ) : (
            <SelectLabware
              slot={slot}
              handleCategoryClick={handleCategoryClick}
              areCategoriesExpanded={areCategoriesExpanded}
              onFlexStacker={onFlexStacker}
              filteredLabwareByCategory={filteredLabwareByCategory}
              searchFilter={searchFilter}
              getIsLabwareFiltered={getIsLabwareFiltered}
              universalLid={universalLid}
            />
          )}
        </Flex>
      </Flex>
    </Modal>,
    getMainPagePortalEl()
  )
}

const StyledLabel = styled.label`
  text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
  text-align: ${TYPOGRAPHY.textAlignCenter};
  display: ${DISPLAY_INLINE_BLOCK};
  cursor: ${CURSOR_POINTER};
  input[type='file'] {
    display: none;
  }
`
