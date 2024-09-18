import * as React from 'react'
import { useTranslation } from 'react-i18next'
import reduce from 'lodash/reduce'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  CheckboxField,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DISPLAY_INLINE_BLOCK,
  Flex,
  InputField,
  JUSTIFY_CENTER,
  ListButton,
  ListButtonAccordion,
  ListButtonAccordionContainer,
  ListButtonRadioButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  ABSORBANCE_READER_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM,
  OT2_ROBOT_TYPE,
  getAreSlotsHorizontallyAdjacent,
  getIsLabwareAboveHeight,
  getLabwareDefIsStandard,
  getLabwareDefURI,
  getModuleType,
} from '@opentrons/shared-data'

import { BUTTON_LINK_STYLE } from '../../../atoms'
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
import {
  selectLabware,
  selectNestedLabware,
} from '../../../labware-ingred/actions'
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
const PLATE_READER_LOADNAME =
  'opentrons_flex_lid_absorbance_plate_reader_module'
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
  const has96Channel = getHas96Channel(pipetteEntities)
  const defs = getOnlyLatestDefs()
  const deckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
  const zoomedInSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const {
    selectedLabwareDefUri,
    selectedModuleModel,
    selectedNestedLabwareDefUri,
  } = zoomedInSlotInfo
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  )
  const [searchTerm, setSearchTerm] = React.useState<string>('')

  const searchFilter = (termToCheck: string): boolean =>
    termToCheck.toLowerCase().includes(searchTerm.toLowerCase())

  const modulesById = deckSetup.modules
  const moduleType =
    selectedModuleModel != null ? getModuleType(selectedModuleModel) : null
  const initialModules: ModuleOnDeck[] = Object.keys(modulesById).map(
    moduleId => modulesById[moduleId]
  )
  const [filterRecommended, setFilterRecommended] = React.useState<boolean>(
    moduleType != null
  )
  //    for OT-2 usage only due to H-S collisions
  const isNextToHeaterShaker = initialModules.some(
    hardwareModule =>
      hardwareModule.type === HEATERSHAKER_MODULE_TYPE &&
      getAreSlotsHorizontallyAdjacent(hardwareModule.slot, slot)
  )
  const [filterHeight, setFilterHeight] = React.useState<boolean>(
    robotType === OT2_ROBOT_TYPE ? isNextToHeaterShaker : false
  )

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
        (slot === 'offDeck' && isAdapter) ||
        (PLATE_READER_LOADNAME === parameters.loadName &&
          moduleType !== ABSORBANCE_READER_TYPE)
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
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
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
        {moduleType != null ||
        (isNextToHeaterShaker && robotType === OT2_ROBOT_TYPE) ? (
          <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
            <CheckboxField
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
        paddingTop={SPACING.spacing8}
      >
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
                      dispatch(selectLabware({ labwareDefUri: labwareURI }))
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
                                              setNoHover={() => {
                                                setHoveredLabware(null)
                                              }}
                                              setHovered={() => {
                                                setHoveredLabware(nestedDefUri)
                                              }}
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
      <Flex
        padding={`${SPACING.spacing4} ${SPACING.spacing12}`}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <StyledLabel css={BUTTON_LINK_STYLE}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('upload_custom_labware')}
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
    </Flex>
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
