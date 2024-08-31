import * as React from 'react'
import { useTranslation } from 'react-i18next'
import reduce from 'lodash/reduce'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import {
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_INLINE_BLOCK,
  Flex,
  InputField,
  ListButton,
  ListButtonAccordion,
  ListButtonAccordionContainer,
  ListButtonRadioButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_TYPE,
  MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM,
  OT2_ROBOT_TYPE,
  getAreSlotsHorizontallyAdjacent,
  getIsLabwareAboveHeight,
  getLabwareDefIsStandard,
  getLabwareDefURI,
  getModuleType,
} from '@opentrons/shared-data'

import { selectors as stepFormSelectors } from '../../../step-forms'
import { getOnlyLatestDefs } from '../../../labware-defs'
import {
  ADAPTER_96_CHANNEL,
  getLabwareIsCompatible as _getLabwareIsCompatible,
} from '../../../utils/labwareModuleCompatibility'
import { getHas96Channel } from '../../../utils'
import { createCustomLabwareDef } from '../../../labware-defs/actions'
import { getRobotType } from '../../../file-data/selectors'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import { getPipetteEntities } from '../../../step-forms/selectors'
import { selectors } from '../../../labware-ingred/selectors'
import { selectLabwareDefUri } from '../../../labware-ingred/actions'
import { ORDERED_CATEGORIES } from './constants'
import {
  getLabwareIsRecommended,
  getLabwareCompatibleWithAdapter,
} from './utils'

import type { DeckSlotId, LabwareDefinition2 } from '@opentrons/shared-data'
import type { ModuleOnDeck } from '../../../step-forms'
import type { ThunkDispatch } from '../../../types'
import type { LabwareDefByDefURI } from '../../../labware-defs'

const CUSTOM_CATEGORY = 'custom'
const STANDARD_X_DIMENSION = 127.75
const STANDARD_Y_DIMENSION = 85.48
interface LabwareToolsProps {
  slot: DeckSlotId
  setHoveredLabware: (defUri: string | null) => void
}

export function LabwareTools(props: LabwareToolsProps): JSX.Element {
  const { slot, setHoveredLabware } = props
  const { t } = useTranslation(['starting_deck_state', 'shared'])
  const robotType = useSelector(getRobotType)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const permittedTipracks = useSelector(stepFormSelectors.getPermittedTipracks)
  const pipetteEntities = useSelector(getPipetteEntities)
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const deckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
  const zoomedInSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const {
    selectedLabwareDefUri,
    selectedModuleModel,
    selectedNestedLabwareDefUri,
  } = zoomedInSlotInfo
  // TODO(ja, 8/16/24): We are always filtering recommended labware, check with designs
  // where to add the filter checkbox/button
  const [filterRecommended, setFilterRecommended] = React.useState<boolean>(
    true
  )
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  )
  const [filterHeight, setFilterHeight] = React.useState<boolean>(false)
  const [searchTerm, setSearchTerm] = React.useState<string>('')

  const searchFilter = (termToCheck: string): boolean =>
    termToCheck.toLowerCase().includes(searchTerm.toLowerCase())

  const has96Channel = getHas96Channel(pipetteEntities)
  const defs = getOnlyLatestDefs()
  const modulesById = deckSetup.modules

  const moduleType =
    selectedModuleModel != null ? getModuleType(selectedModuleModel) : null
  const initialModules: ModuleOnDeck[] = Object.keys(modulesById).map(
    moduleId => modulesById[moduleId]
  )
  //    for OT-2 usage only due to H-S collisions
  const isNextToHeaterShaker = initialModules.some(
    hardwareModule =>
      hardwareModule.type === HEATERSHAKER_MODULE_TYPE &&
      getAreSlotsHorizontallyAdjacent(hardwareModule.slot, slot)
  )
  // if you're adding labware to a module, check the recommended filter by default
  React.useEffect(() => {
    setFilterRecommended(moduleType != null)
    if (robotType === OT2_ROBOT_TYPE) {
      setFilterHeight(isNextToHeaterShaker)
    }
  }, [moduleType, isNextToHeaterShaker, robotType])

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
        !getLabwareCompatible(labwareDef) ||
        (isAdapter &&
          isIrregularSize &&
          moduleType !== HEATERSHAKER_MODULE_TYPE) ||
        (isAdapter96Channel && !has96Channel) ||
        (slot === 'offDeck' && isAdapter)
      )
    },
    [filterRecommended, filterHeight, getLabwareCompatible, moduleType, slot]
  )
  const customLabwareURIs: string[] = React.useMemo(
    () => Object.keys(customLabwareDefs),
    [customLabwareDefs]
  )
  const labwareByCategory = React.useMemo(() => {
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

  const populatedCategories: { [category: string]: boolean } = React.useMemo(
    () =>
      ORDERED_CATEGORIES.reduce((acc, category) => {
        const isDeckLocationCategory =
          slot === 'offDeck' ? category !== 'adapter' : true
        return category in labwareByCategory &&
          isDeckLocationCategory &&
          labwareByCategory[category].some(lw =>
            searchFilter(lw.metadata.displayName)
          )
          ? {
              ...acc,
              [category]: labwareByCategory[category].some(
                def => !getIsLabwareFiltered(def)
              ),
            }
          : acc
      }, {}),
    [labwareByCategory, getIsLabwareFiltered, searchTerm]
  )
  const handleCategoryClick = (category: string): void => {
    setSelectedCategory(selectedCategory === category ? null : category)
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        marginY={SPACING.spacing16}
        gridGap={SPACING.spacing8}
      >
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('add_labware')}
        </StyledText>
        <InputField
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
          }}
          placeholder="Search for labware..."
          size="medium"
          leftIcon="search"
          showDeleteIcon
          onDelete={() => {
            setSearchTerm('')
          }}
        />
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        {customLabwareURIs.length === 0 ? null : (
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
                isExpanded={CUSTOM_CATEGORY === selectedCategory}
              >
                {customLabwareURIs.map((labwareURI, index) => (
                  <ListButtonRadioButton
                    key={`${index}_${labwareURI}`}
                    id={`${index}_${labwareURI}`}
                    buttonText={
                      customLabwareDefs[labwareURI].metadata.displayName
                    }
                    setNoHover={() => {
                      setHoveredLabware(null)
                    }}
                    setHovered={() => {
                      setHoveredLabware(labwareURI)
                    }}
                    buttonValue={labwareURI}
                    onChange={e => {
                      e.stopPropagation()
                      dispatch(
                        selectLabwareDefUri({ labwareDefUri: labwareURI })
                      )
                    }}
                    isSelected={labwareURI === selectedLabwareDefUri}
                  />
                ))}
              </ListButtonAccordion>
            </ListButtonAccordionContainer>
          </ListButton>
        )}
        {ORDERED_CATEGORIES.map(category => {
          const isPopulated = populatedCategories[category]
          if (isPopulated) {
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
                    isExpanded={category === selectedCategory}
                  >
                    {labwareByCategory[category]?.map((labwareDef, index) => {
                      const isFiltered = getIsLabwareFiltered(labwareDef)
                      const labwareURI = getLabwareDefURI(labwareDef)
                      const loadName = labwareDef.parameters.loadName
                      const isMatch = searchFilter(
                        labwareDef.metadata.displayName
                      )
                      if (!isFiltered && isMatch) {
                        return (
                          <React.Fragment
                            key={`${index}_${category}_${loadName}`}
                          >
                            <ListButtonRadioButton
                              setNoHover={() => {
                                setHoveredLabware(null)
                              }}
                              setHovered={() => {
                                setHoveredLabware(labwareURI)
                              }}
                              id={`${index}_${category}_${loadName}`}
                              buttonText={labwareDef.metadata.displayName}
                              buttonValue={labwareURI}
                              onChange={e => {
                                e.stopPropagation()
                                dispatch(
                                  selectLabware({
                                    labwareDefUri:
                                      labwareURI === selectedLabwareDefUri
                                        ? null
                                        : labwareURI,
                                  })
                                )
                                // reset the nested labware def uri in case it is not compatible
                                dispatch(
                                  selectNestedLabware({
                                    nestedLabwareDefUri: null,
                                  })
                                )
                              }}
                              isSelected={labwareURI === selectedLabwareDefUri}
                            />

                            {labwareURI === selectedLabwareDefUri &&
                              getLabwareCompatibleWithAdapter(loadName)
                                ?.length > 0 && (
                                <ListButtonAccordionContainer
                                  id={`nestedAccordionContainer_${loadName}`}
                                >
                                  <ListButtonAccordion
                                    key={`${index}_${category}_${loadName}_accordion`}
                                    isNested
                                    mainHeadline={t('adapter_compatible_lab')}
                                    isExpanded={
                                      labwareURI === selectedLabwareDefUri
                                    }
                                  >
                                    {has96Channel &&
                                    loadName === ADAPTER_96_CHANNEL
                                      ? permittedTipracks.map(
                                          (tiprackDefUri, index) => {
                                            const nestedDef =
                                              defs[tiprackDefUri]
                                            return (
                                              <ListButtonRadioButton
                                                setNoHover={() => {
                                                  setHoveredLabware(null)
                                                }}
                                                setHovered={() => {
                                                  setHoveredLabware(
                                                    tiprackDefUri
                                                  )
                                                }}
                                                key={`${index}_${category}_${loadName}_${tiprackDefUri}`}
                                                id={`${index}_${category}_${loadName}_${tiprackDefUri}`}
                                                buttonText={
                                                  nestedDef?.metadata
                                                    .displayName ?? ''
                                                }
                                                buttonValue={tiprackDefUri}
                                                onChange={e => {
                                                  e.stopPropagation()
                                                  dispatch(
                                                    selectNestedLabware({
                                                      nestedLabwareDefUri: tiprackDefUri,
                                                    })
                                                  )
                                                }}
                                                isSelected={
                                                  tiprackDefUri ===
                                                  selectedNestedLabwareDefUri
                                                }
                                              />
                                            )
                                          }
                                        )
                                      : getLabwareCompatibleWithAdapter(
                                          loadName
                                        ).map(nestedDefUri => {
                                          const nestedDef = defs[nestedDefUri]

                                          return (
                                            <ListButtonRadioButton
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
                                                  selectNestedLabware({
                                                    nestedLabwareDefUri: nestedDefUri,
                                                  })
                                                )
                                              }}
                                              isSelected={
                                                nestedDefUri ===
                                                selectedNestedLabwareDefUri
                                              }
                                            />
                                          )
                                        })}
                                  </ListButtonAccordion>
                                </ListButtonAccordionContainer>
                              )}
                          </React.Fragment>
                        )
                      }
                    })}
                  </ListButtonAccordion>
                </ListButtonAccordionContainer>
              </ListButton>
            )
          }
        })}
      </Flex>
      <StyledLabel>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('custom_labware')}
        </StyledText>
        <input
          data-testid="customLabwareInput"
          type="file"
          onChange={e => {
            setSelectedCategory(CUSTOM_CATEGORY)
            dispatch(createCustomLabwareDef(e))
          }}
        />
      </StyledLabel>
    </Flex>
  )
}

const StyledLabel = styled.label`
  text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
  text-align: ${TYPOGRAPHY.textAlignCenter}};
  display: ${DISPLAY_INLINE_BLOCK}
  cursor: pointer;
  input[type='file'] {
    display: none;
  }
`
