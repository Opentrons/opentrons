import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import reduce from 'lodash/reduce'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  CheckboxField,
  CURSOR_POINTER,
  CustomizeExpandButton,
  DIRECTION_COLUMN,
  DISPLAY_INLINE_BLOCK,
  Flex,
  InfoScreen,
  InlineNotification,
  InputField,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  ListButton,
  ListButtonAccordion,
  ListButtonAccordionContainer,
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
import {
  selectAdapter,
  selectLid,
  selectTopLabware,
  selectTopLabwareAmount,
} from '../../../labware-ingred/actions'
import { selectors } from '../../../labware-ingred/selectors'
import {
  ALL_ORDERED_CATEGORIES,
  CUSTOM_CATEGORY,
  ORDERED_CATEGORIES,
} from '../../../pages/Designer/DeckSetup/constants'
import {
  getLabwareCompatibleWithAdapter,
  getLabwareIsRecommended,
  getStackerDefinition,
} from '../../../pages/Designer/DeckSetup/utils'
import { TC_LID_LOADNAME } from '../../../pages/Designer/utils'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { getPipetteEntities } from '../../../step-forms/selectors'
import { getHas96Channel } from '../../../utils'
import {
  ADAPTER_96_CHANNEL,
  getLabwareCompatibleWithModule,
} from '../../../utils/labwareModuleCompatibility'
import { getMainPagePortalEl } from '../Portal'

import type { ChangeEvent } from 'react'
import type { StackingProps } from '@opentrons/components'
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
interface SelectLabwareModalProps {
  slot: DeckSlotId
  onClose: () => void
  onConfirm: () => void
  slotFull: boolean
}

interface LabwareInfo {
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
  const deckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
  const zoomedInSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const {
    selectedTopLabware,
    selectedModuleModel,
    selectedAdapterDefURI,
    selectedLidLabware,
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

  const stackingPropsShared = {
    inputTitle: t('labware_quantity'),
    errorMessage: t('unsupported_range'),
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
          overflowY="auto"
          maxHeight="15.5rem"
          paddingTop={SPACING.spacing8}
        >
          {filteredLabwareByCategory[CUSTOM_CATEGORY].length > 0 ? (
            <ListButton
              key={`ListButton_${CUSTOM_CATEGORY}`}
              type="noActive"
              onClick={() => {
                handleCategoryClick(CUSTOM_CATEGORY)
              }}
            >
              <ListButtonAccordionContainer id={`${CUSTOM_CATEGORY}_${slot}`}>
                <ListButtonAccordion
                  mainHeadline={t(`${CUSTOM_CATEGORY}`)}
                  isExpanded={areCategoriesExpanded[CUSTOM_CATEGORY]}
                >
                  {filteredLabwareByCategory[CUSTOM_CATEGORY].map(
                    ({ uri }, index) => (
                      <CustomizeExpandButton
                        loadName={customLabwareDefs[uri].parameters.loadName}
                        allowInputField={onFlexStacker}
                        key={`${index}_${uri}`}
                        id={`${index}_${uri}`}
                        buttonText={customLabwareDefs[uri].metadata.displayName}
                        buttonValue={uri}
                        onChange={e => {
                          e.stopPropagation()
                          dispatch(selectTopLabware({ labwareDefURI: uri }))
                        }}
                        isSelected={uri === selectedTopLabware.labwareDefURI}
                      />
                    )
                  )}
                </ListButtonAccordion>
              </ListButtonAccordionContainer>
            </ListButton>
          ) : null}
          {slotFull ? (
            <InfoScreen
              content={t('remove_existing_labware')}
              subContent={t('labware_already_in_slot')}
            />
          ) : (
            <>
              {ORDERED_CATEGORIES.map(category => {
                if (filteredLabwareByCategory[category].length > 0) {
                  return (
                    <ListButton
                      key={`ListButton_${category}`}
                      type="noActive"
                      onClick={() => {
                        handleCategoryClick(category)
                      }}
                    >
                      <ListButtonAccordionContainer id={`${category}_${slot}`}>
                        <ListButtonAccordion
                          mainHeadline={t(`${category}`)}
                          isExpanded={areCategoriesExpanded[category]}
                        >
                          {filteredLabwareByCategory[category]?.map(
                            ({ def, uri }, index) => {
                              const loadName = def.parameters.loadName
                              const isAdapter = def.allowedRoles?.includes(
                                'adapter'
                              )
                              const stackingLabwareDefUri = getStackerDefinition(
                                {
                                  ...defs,
                                  ...customLabwareDefs,
                                },
                                loadName
                              )

                              const stackingProps: StackingProps | null =
                                stackingLabwareDefUri != null &&
                                slot !== 'offDeck' &&
                                enableStacking
                                  ? {
                                      ...stackingPropsShared,
                                      inputCaption: t('valid_range', {
                                        max:
                                          defs[stackingLabwareDefUri]
                                            .stackLimit,
                                      }),
                                      definition: defs[stackingLabwareDefUri],
                                      inputFieldValue:
                                        selectedTopLabware.amount ?? 0,
                                      onInputFieldChange: (
                                        e: ChangeEvent<any>
                                      ) => {
                                        dispatch(
                                          selectTopLabwareAmount({
                                            amount: parseInt(
                                              e.target.value as string
                                            ),
                                          })
                                        )
                                      },
                                      checkboxCaption: t('with_lid', {
                                        name:
                                          defs[stackingLabwareDefUri].metadata
                                            .displayName,
                                      }),
                                      checked: selectedLidLabware != null,
                                      onCheckboxChange: () => {
                                        dispatch(
                                          selectLid({
                                            labwareDefURI:
                                              selectedLidLabware ===
                                              stackingLabwareDefUri
                                                ? null
                                                : stackingLabwareDefUri,
                                          })
                                        )
                                      },
                                    }
                                  : null

                              return searchFilter(def.metadata.displayName) &&
                                !getIsLabwareFiltered(def) ? (
                                <Fragment
                                  key={`${index}_${category}_${loadName}`}
                                >
                                  <CustomizeExpandButton
                                    loadName={loadName}
                                    allowInputField={
                                      onFlexStacker ||
                                      loadName === TC_LID_LOADNAME
                                    }
                                    stackingProps={stackingProps ?? undefined}
                                    id={`${index}_${category}_${loadName}`}
                                    buttonText={def.metadata.displayName}
                                    buttonValue={uri}
                                    onChange={e => {
                                      e.stopPropagation()
                                      if (isAdapter) {
                                        dispatch(
                                          selectAdapter({
                                            adapterDefURI:
                                              uri === selectedAdapterDefURI
                                                ? null
                                                : uri,
                                          })
                                        )
                                        dispatch(
                                          selectTopLabware({
                                            labwareDefURI: null,
                                          })
                                        )
                                      } else {
                                        dispatch(
                                          selectTopLabware({
                                            labwareDefURI:
                                              uri ===
                                              selectedTopLabware.labwareDefURI
                                                ? null
                                                : uri,
                                          })
                                        )
                                      }
                                    }}
                                    isSelected={
                                      (isAdapter &&
                                        uri === selectedAdapterDefURI) ||
                                      (!isAdapter &&
                                        uri ===
                                          selectedTopLabware.labwareDefURI)
                                    }
                                  />

                                  {isAdapter &&
                                    uri === selectedAdapterDefURI &&
                                    getLabwareCompatibleWithAdapter(
                                      defs,
                                      enableStacking,
                                      loadName
                                    )?.length > 0 && (
                                      <ListButtonAccordionContainer
                                        id={`nestedAccordionContainer_${loadName}`}
                                      >
                                        <ListButtonAccordion
                                          key={`${index}_${category}_${loadName}_accordion`}
                                          isNested
                                          mainHeadline={t(
                                            'adapter_compatible_lab'
                                          )}
                                          isExpanded={
                                            uri === selectedAdapterDefURI
                                          }
                                        >
                                          {has96Channel &&
                                          loadName === ADAPTER_96_CHANNEL
                                            ? permittedTipracks.map(
                                                (tiprackDefUri, index) => {
                                                  const nestedDef =
                                                    defs[tiprackDefUri]
                                                  return (
                                                    <CustomizeExpandButton
                                                      loadName={loadName}
                                                      allowInputField={false}
                                                      key={`${index}_${category}_${loadName}_${tiprackDefUri}`}
                                                      id={`${index}_${category}_${loadName}_${tiprackDefUri}`}
                                                      buttonText={
                                                        nestedDef?.metadata
                                                          .displayName ?? ''
                                                      }
                                                      buttonValue={
                                                        tiprackDefUri
                                                      }
                                                      onChange={e => {
                                                        e.stopPropagation()
                                                        dispatch(
                                                          selectTopLabware({
                                                            labwareDefURI: tiprackDefUri,
                                                          })
                                                        )
                                                      }}
                                                      isSelected={
                                                        tiprackDefUri ===
                                                        selectedTopLabware.labwareDefURI
                                                      }
                                                    />
                                                  )
                                                }
                                              )
                                            : getLabwareCompatibleWithAdapter(
                                                {
                                                  ...defs,
                                                  ...customLabwareDefs,
                                                },
                                                enableStacking,
                                                loadName
                                              ).map(nestedDefUri => {
                                                const nestedDef =
                                                  defs[nestedDefUri] ??
                                                  customLabwareDefs[
                                                    nestedDefUri
                                                  ]

                                                const stackingLabwareDefUri = getStackerDefinition(
                                                  {
                                                    ...defs,
                                                    ...customLabwareDefs,
                                                  },
                                                  nestedDef.parameters.loadName
                                                )

                                                const stackingProps: StackingProps | null =
                                                  stackingLabwareDefUri !=
                                                    null && slot !== 'offDeck'
                                                    ? {
                                                        ...stackingPropsShared,
                                                        inputCaption: t(
                                                          'valid_range',
                                                          {
                                                            max:
                                                              defs[
                                                                stackingLabwareDefUri
                                                              ].stackLimit,
                                                          }
                                                        ),
                                                        definition:
                                                          defs[
                                                            stackingLabwareDefUri
                                                          ],
                                                        inputFieldValue:
                                                          selectedTopLabware.amount ??
                                                          1,
                                                        onInputFieldChange: (
                                                          e: ChangeEvent<any>
                                                        ) => {
                                                          dispatch(
                                                            selectTopLabwareAmount(
                                                              {
                                                                amount: parseInt(
                                                                  e.target
                                                                    .value as string
                                                                ),
                                                              }
                                                            )
                                                          )
                                                        },
                                                      }
                                                    : null

                                                return (
                                                  <CustomizeExpandButton
                                                    loadName={
                                                      nestedDef.parameters
                                                        .loadName
                                                    }
                                                    allowInputField={
                                                      nestedDef.parameters
                                                        .loadName ===
                                                      TC_LID_LOADNAME
                                                    }
                                                    stackingProps={
                                                      stackingProps ?? undefined
                                                    }
                                                    key={`${index}_${category}_${loadName}_${nestedDefUri}`}
                                                    id={`${index}_${category}_${loadName}_${nestedDefUri}`}
                                                    buttonText={
                                                      nestedDef?.metadata
                                                        .displayName ?? ''
                                                    }
                                                    buttonValue={nestedDefUri}
                                                    onChange={e => {
                                                      e.stopPropagation()
                                                      dispatch(
                                                        selectTopLabware({
                                                          labwareDefURI: nestedDefUri,
                                                        })
                                                      )
                                                    }}
                                                    isSelected={
                                                      nestedDefUri ===
                                                      selectedTopLabware.labwareDefURI
                                                    }
                                                  />
                                                )
                                              })}
                                        </ListButtonAccordion>
                                      </ListButtonAccordionContainer>
                                    )}
                                </Fragment>
                              ) : null
                            }
                          )}
                        </ListButtonAccordion>
                      </ListButtonAccordionContainer>
                    </ListButton>
                  )
                }
              })}
            </>
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
