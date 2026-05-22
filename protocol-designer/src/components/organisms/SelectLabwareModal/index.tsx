import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import reduce from 'lodash/reduce'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  CheckboxField,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DISPLAY_INLINE_BLOCK,
  Flex,
  Icon,
  InfoScreen,
  InlineNotification,
  InputField,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  Modal,
  OVERFLOW_AUTO,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_V1,
  getAreSlotsHorizontallyAdjacent,
  getIsLabwareAboveHeight,
  getLabwareDefIsStandard,
  getLabwareDefURI,
  getMaxPoolCount,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM,
  OT2_ROBOT_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  getIsSlotAHopper,
  getIsSlotAVacuumDock,
} from '@opentrons/step-generation'

import { LINK_BUTTON_STYLE } from '/protocol-designer/components/atoms'
import { VACUUM_MODULE_TYPE_WITH_LABWARE } from '/protocol-designer/constants'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import { getOnlyLatestDefs } from '/protocol-designer/labware-defs'
import { createCustomLabwareDef } from '/protocol-designer/labware-defs/actions'
import { getCustomLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'
import {
  selectAdapter,
  selectLid,
  selectTopLabware,
} from '/protocol-designer/labware-ingred/actions'
import { selectors } from '/protocol-designer/labware-ingred/selectors'
import {
  ALL_ORDERED_CATEGORIES,
  CUSTOM_CATEGORY,
} from '/protocol-designer/pages/Designer/DeckSetup/constants'
import {
  getIsVacuumCollar,
  getLabwareIsRecommended,
} from '/protocol-designer/pages/Designer/DeckSetup/utils'
import { TIPRACK_LID_LOADNAME } from '/protocol-designer/pages/Designer/utils'
import { selectors as stepFormSelectors } from '/protocol-designer/step-forms'
import { getPipetteEntities } from '/protocol-designer/step-forms/selectors'
import { getHas96Channel } from '/protocol-designer/utils'
import {
  ADAPTER_96_CHANNEL,
  COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE,
  getLabwareCompatibleWithModule,
} from '/protocol-designer/utils/labwareModuleCompatibility'

import { getMainPagePortalEl } from '../Portal'
import { SelectCustomLabware } from './SelectCustomLabware'
import { SelectLabware } from './SelectLabware'

import type { ChangeEvent } from 'react'
import type { DeckSlotId, LabwareDefinition2 } from '@opentrons/shared-data'
import type { LabwareDefByDefURI } from '/protocol-designer/labware-defs'
import type { CategoryExpand } from '/protocol-designer/pages/Designer/DeckSetup/DeckSetupToolbox'
import type { ModuleOnDeck } from '/protocol-designer/step-forms'
import type { ThunkDispatch } from '/protocol-designer/types'

const STANDARD_X_DIMENSION = 127.75
const STANDARD_Y_DIMENSION = 85.48
const PLATE_READER_LOADNAME =
  'opentrons_flex_lid_absorbance_plate_reader_module'
const UNIVERSAL_LID_LOADNAME = 'opentrons_tough_universal_lid'
const STACK_LIMIT = 1

interface SelectLabwareModalProps {
  slot: DeckSlotId
  onClose: () => void
  onConfirm: () => void
  slotFull: boolean
  moduleHasLabware?: boolean
}

export interface LabwareInfo {
  uri: string
  def: LabwareDefinition2
}

export function SelectLabwareModal(
  props: SelectLabwareModalProps
): JSX.Element {
  const { slot, onClose, onConfirm, slotFull, moduleHasLabware = false } = props
  const { t } = useTranslation(['starting_deck_state', 'shared'])
  const robotType = useSelector(getRobotType)
  const [error, setError] = useState<string | null>(null)

  const dispatch = useDispatch<ThunkDispatch<any>>()
  const permittedTipracks = useSelector(stepFormSelectors.getPermittedTipracks)
  const pipetteEntities = useSelector(getPipetteEntities)
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const has96Channel = getHas96Channel(pipetteEntities)
  const defs = getOnlyLatestDefs()
  const universalLid = Object.entries(defs).find(
    ([_, def]) => def.parameters.loadName === UNIVERSAL_LID_LOADNAME
  )
  const deckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
  const zoomedInSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const { selectedTopLabware, selectedModuleModel, selectedAdapterDefURI } =
    zoomedInSlotInfo

  const hasNoLabware =
    selectedTopLabware == null && selectedAdapterDefURI == null
  const createCategoryState = (state: boolean): Record<string, boolean> =>
    Object.fromEntries(ALL_ORDERED_CATEGORIES.map(cat => [cat, state]))

  const allCategoriesExpanded = useMemo(() => createCategoryState(true), [])
  const allCategoriesCollapsed = useMemo(() => createCategoryState(false), [])

  const [userCategoryExpandState, setUserCategoryExpandState] =
    useState<CategoryExpand>(allCategoriesCollapsed)

  const [searchTerm, setSearchTerm] = useState<string>('')
  const areCategoriesExpanded = searchTerm
    ? allCategoriesExpanded
    : userCategoryExpandState

  useEffect(
    () => {
      if (!hasNoLabware && error != null) {
        setError(null)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasNoLabware]
  )

  const handleResetLabwareTools = (): void => {
    setUserCategoryExpandState(allCategoriesCollapsed)
    setSearchTerm('')
    // Clear all selections when closing modal without saving
    dispatch(selectAdapter({ adapterDefURI: null }))
    dispatch(selectTopLabware({ labwareDefURI: null }))
    dispatch(selectLid({ labwareDefURI: null }))
  }

  const searchFilter = (termToCheck: string): boolean =>
    termToCheck.toLowerCase().includes(searchTerm.toLowerCase())

  const modulesById = deckSetup.modules
  const moduleType =
    selectedModuleModel != null ? getModuleType(selectedModuleModel) : null
  const isOnHopper = getIsSlotAHopper(slot)
  const isOnVacuumDock = getIsSlotAVacuumDock(slot)

  // Check if dock itself has a collar (not the main vacuum area)
  const vacuumModuleInA3 = Object.values(modulesById).find(
    module => module.type === VACUUM_MODULE_TYPE && module.slot === 'A3'
  )
  const dockHasCollar =
    vacuumModuleInA3 != null &&
    isOnVacuumDock &&
    Object.values(deckSetup.labware).some(labware => {
      const isOnDock = labware.stack.includes('vacuumDock')
      const isCollar = getIsVacuumCollar(labware.def)
      return isOnDock && isCollar
    })

  const initialModules: ModuleOnDeck[] = Object.keys(modulesById).map(
    moduleId => modulesById[moduleId]
  )
  const [filterRecommended, setFilterRecommended] = useState<boolean>(
    moduleType != null || isOnVacuumDock || isOnHopper
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
      // for vacuum dock, use dock-specific compatibility
      if (isOnVacuumDock && moduleType === VACUUM_MODULE_TYPE) {
        return (
          COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE[
            VACUUM_MODULE_TYPE_WITH_LABWARE
          ].includes(def.parameters.loadName) ||
          def.metadata.displayCategory === 'wellPlate'
        )
      }
      return getLabwareCompatibleWithModule(def, moduleType)
    },
    [moduleType, isOnVacuumDock]
  )

  const getIsLabwareFiltered = useCallback(
    (labwareDef: LabwareDefinition2) => {
      const { dimensions, parameters } = labwareDef
      const { xDimension, yDimension } = dimensions

      const isSmallXDimension = xDimension < STANDARD_X_DIMENSION
      const isSmallYDimension = yDimension < STANDARD_Y_DIMENSION
      const isIrregularSize = isSmallXDimension && isSmallYDimension
      const isAdapter = labwareDef.allowedRoles?.includes('adapter')
      const isLid = labwareDef.allowedRoles?.includes('lid')
      const isAdapter96Channel = parameters.loadName === ADAPTER_96_CHANNEL
      const isWellPlate = labwareDef.metadata.displayCategory === 'wellPlate'
      const isVacuumCollar = getIsVacuumCollar(labwareDef)

      // for vacuum dock, show collars when empty, wellplates when collar present
      if (isOnVacuumDock) {
        if (!dockHasCollar) {
          // no collar on dock yet, so show only collars
          return !isVacuumCollar
        }
        // collar present on dock, so show only wellplates and lids
        return !isWellPlate && !isLid
      }

      return (
        (filterRecommended &&
          !getLabwareIsRecommended(
            labwareDef,
            selectedModuleModel,
            moduleHasLabware,
            isOnVacuumDock,
            dockHasCollar
          )) ||
        (filterHeight &&
          getIsLabwareAboveHeight(
            labwareDef,
            MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM
          )) ||
        !getIsLabwareCompatible(labwareDef) ||
        (isAdapter &&
          isIrregularSize &&
          moduleType !== HEATERSHAKER_MODULE_TYPE &&
          moduleType !== VACUUM_MODULE_TYPE) ||
        (isAdapter96Channel && !has96Channel) ||
        (slot === 'offDeck' && (isAdapter || isLid)) ||
        (PLATE_READER_LOADNAME === parameters.loadName &&
          moduleType !== ABSORBANCE_READER_TYPE) ||
        parameters.loadName === TIPRACK_LID_LOADNAME
      )
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      filterRecommended,
      filterHeight,
      getIsLabwareCompatible,
      moduleType,
      slot,
      isOnVacuumDock,
      dockHasCollar,
    ]
  )

  const labwareByCategory = useMemo(
    () => {
      return reduce<
        LabwareDefByDefURI,
        { [category: string]: LabwareDefinition2[] }
      >(
        defs,
        (acc, def: (typeof defs)[keyof typeof defs]) => {
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
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permittedTipracks]
  )

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
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labwareByCategory, getIsLabwareFiltered, searchTerm]
  )
  const handleCategoryClick = (category: string, expand?: boolean): void => {
    const updatedExpandState = {
      ...userCategoryExpandState,
      [category]: expand ?? !userCategoryExpandState[category],
    }
    setUserCategoryExpandState(updatedExpandState)
  }

  const validateQuantity = (): boolean => {
    const { selectedTopLabware } = zoomedInSlotInfo
    if (selectedTopLabware.labwareDefURI == null) {
      return true
    }
    const selectedLabwareDef =
      defs[selectedTopLabware.labwareDefURI] ??
      customLabwareDefs[selectedTopLabware.labwareDefURI]

    const amount = selectedTopLabware.amount ?? 0
    const hopperStackLimit = getMaxPoolCount({
      labwareDefinitions: {
        primary: selectedLabwareDef,
        adapter: null,
        lid: null,
      },
      model: FLEX_STACKER_MODULE_V1,
    })
    const stackLimit = isOnHopper
      ? hopperStackLimit
      : (selectedLabwareDef.stackLimit ?? STACK_LIMIT)

    if (amount < 1 || amount > stackLimit) {
      return false
    }

    return true
  }

  const handleAddLabwareClick = (): void => {
    if (slotFull) {
      setError(t('no_space') as string)
      return
    }
    if (hasNoLabware) {
      setError(t('select_before_proceeding') as string)
      return
    }

    if (!validateQuantity()) {
      setError(t('quantity_out_of_limit') as string)
      return
    }

    onConfirm()
    handleResetLabwareTools()
  }

  return createPortal(
    <Modal
      marginLeft="0"
      title={t('add_labware')}
      type="info"
      width="37.125rem"
      maxHeight="39.5rem"
      childrenPadding={SPACING.spacing24}
      onClose={() => {
        onClose()
        handleResetLabwareTools()
      }}
      footer={
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
          {!slotFull ? (
            <Flex
              justifyContent={JUSTIFY_CENTER}
              padding={`${SPACING.spacing4} ${SPACING.spacing12}`}
            >
              <Flex padding={SPACING.spacing4}>
                <StyledLabel css={LINK_BUTTON_STYLE}>
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('upload_custom_labware')}
                  </StyledText>
                  <input
                    type="file"
                    onChange={e => {
                      dispatch(createCustomLabwareDef(e))
                      handleCategoryClick(CUSTOM_CATEGORY, true)
                    }}
                  />
                </StyledLabel>
              </Flex>
            </Flex>
          ) : null}
          <Flex
            gridGap={SPACING.spacing8}
            justifyContent={JUSTIFY_END}
            alignItems={ALIGN_CENTER}
            padding={`0 ${SPACING.spacing24} ${SPACING.spacing24} ${SPACING.spacing24}`}
          >
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
            <PrimaryButton onClick={handleAddLabwareClick}>
              {t('add_labware')}
            </PrimaryButton>
          </Flex>
        </Flex>
      }
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        height="100%"
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <InputField
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSearchTerm(e.target.value)
            }}
            placeholder={t('search_labware')}
            size="medium"
            leftElement={
              <Icon name="search" size="1.25rem" color={COLORS.grey60} />
            }
            rightElement={
              <Icon
                name="close"
                size="1.75rem"
                onClick={() => {
                  setSearchTerm('')
                }}
              />
            }
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
          flex="1"
          overflowY={OVERFLOW_AUTO}
          paddingTop={SPACING.spacing8}
        >
          <SelectCustomLabware
            slot={slot}
            handleCategoryClick={handleCategoryClick}
            areCategoriesExpanded={areCategoriesExpanded}
            isOnHopper={isOnHopper}
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
              isOnHopper={isOnHopper}
              filteredLabwareByCategory={filteredLabwareByCategory}
              searchFilter={searchFilter}
              getIsLabwareFiltered={getIsLabwareFiltered}
              universalLid={universalLid}
              moduleType={moduleType}
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
