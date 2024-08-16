import * as React from 'react'
import { useTranslation } from 'react-i18next'
import reduce from 'lodash/reduce'
import { useSelector } from 'react-redux'
import {
  DIRECTION_COLUMN,
  Flex,
  ListButton,
  ListButtonAccordion,
  ListButtonAccordionContainer,
  ListButtonRadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { selectors as stepFormSelectors } from '../../step-forms'
import {
  HEATERSHAKER_MODULE_TYPE,
  MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM,
  MODULE_MODELS,
  getAreSlotsHorizontallyAdjacent,
  getIsLabwareAboveHeight,
  getLabwareDefIsStandard,
  getLabwareDefURI,
  getModuleType,
} from '@opentrons/shared-data'
import { getOnlyLatestDefs } from '../../labware-defs'
import {
  ADAPTER_96_CHANNEL,
  getLabwareIsCompatible as _getLabwareIsCompatible,
  getLabwareCompatibleWithAdapter,
} from '../../utils/labwareModuleCompatibility'
import { getHas96Channel } from '../../utils'
import { getPipetteEntities } from '../../step-forms/selectors'
import { ORDERED_CATEGORIES } from './constants'
import { getLabwareIsRecommended } from './utils'
import type {
  DeckSlotId,
  LabwareDefinition2,
  ModuleModel,
} from '@opentrons/shared-data'
import type { ModuleOnDeck } from '../../step-forms'
import type { LabwareDefByDefURI } from '../../labware-defs'

import type { Fixture } from './constants'

interface LabwareToolsProps {
  slot: DeckSlotId
  selectedHardware: ModuleModel | Fixture | null
  setSelectedLabwareDefURI: React.Dispatch<React.SetStateAction<string | null>>
  selecteLabwareDefURI: string | null
  setNestedSelectedLabwareDefURI: React.Dispatch<
    React.SetStateAction<string | null>
  >
  selectedNestedSelectedLabwareDefURI: string | null
}

export const LabwareTools = (props: LabwareToolsProps): JSX.Element => {
  const {
    slot,
    selectedHardware,
    setSelectedLabwareDefURI,
    selecteLabwareDefURI,
    setNestedSelectedLabwareDefURI,
    selectedNestedSelectedLabwareDefURI,
  } = props
  const { t } = useTranslation(['starting_deck_state', 'shared'])
  const permittedTipracks = useSelector(stepFormSelectors.getPermittedTipracks)
  const pipetteEntities = useSelector(getPipetteEntities)
  const has96Channel = getHas96Channel(pipetteEntities)
  const deckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
  const defs = getOnlyLatestDefs()
  const modulesById = deckSetup.modules

  const moduleModel = MODULE_MODELS.includes(selectedHardware as ModuleModel)
    ? (selectedHardware as ModuleModel)
    : null

  const moduleType = moduleModel != null ? getModuleType(moduleModel) : null
  const initialModules: ModuleOnDeck[] = Object.keys(modulesById).map(
    moduleId => modulesById[moduleId]
  )
  const isNextToHeaterShaker = initialModules.some(
    hardwareModule =>
      hardwareModule.type === HEATERSHAKER_MODULE_TYPE &&
      getAreSlotsHorizontallyAdjacent(hardwareModule.slot, slot)
  )
  // if you're adding labware to a module, check the recommended filter by default
  React.useEffect(() => {
    setFilterRecommended(moduleType != null)
    setFilterHeight(isNextToHeaterShaker)
  }, [moduleType, isNextToHeaterShaker])

  //    TODO: We are always filtering recommended labware, check with designs
  //    where to add the filter checkbox
  const [filterRecommended, setFilterRecommended] = React.useState<boolean>(
    true
  )
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  )

  const [filterHeight, setFilterHeight] = React.useState<boolean>(false)
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

      const isSmallXDimension = xDimension < 127.75
      const isSmallYDimension = yDimension < 85.48
      const isIrregularSize = isSmallXDimension && isSmallYDimension

      const isAdapter = labwareDef.allowedRoles?.includes('adapter')
      const isAdapter96Channel = parameters.loadName === ADAPTER_96_CHANNEL
      return (
        (filterRecommended &&
          !getLabwareIsRecommended(labwareDef, moduleModel)) ||
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
      ORDERED_CATEGORIES.reduce(
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
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      marginTop={SPACING.spacing16}
    >
      <Flex>TODO: add search bar</Flex>
      <Flex marginBottom={SPACING.spacing4}>
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('add_labware')}
        </StyledText>
      </Flex>
      {ORDERED_CATEGORIES.map(category => {
        const isPopulated = populatedCategories[category]
        if (isPopulated) {
          return (
            <ListButton
              key={`ListButton_${category}`}
              type="noActive"
              onClick={() => {
                setSelectedCategory(category)
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
                    if (!isFiltered) {
                      return (
                        <React.Fragment
                          key={`${index}_${category}_${loadName}`}
                        >
                          <ListButtonRadioButton
                            id={`${index}_${category}_${loadName}`}
                            buttonText={labwareDef.metadata.displayName}
                            buttonValue={labwareURI}
                            onChange={e => {
                              e.stopPropagation()
                              setSelectedLabwareDefURI(labwareURI)
                            }}
                            isSelected={labwareURI === selecteLabwareDefURI}
                          />

                          {labwareURI === selecteLabwareDefURI &&
                            getLabwareCompatibleWithAdapter(loadName)?.length >
                              0 && (
                              <ListButtonAccordionContainer
                                id={`nestedAccordionContainer_${loadName}`}
                              >
                                <ListButtonAccordion
                                  key={`${index}_${category}_${loadName}_accordion`}
                                  isNested
                                  mainHeadline={t('adapter_compatible_lab')}
                                  isExpanded={
                                    labwareURI === selecteLabwareDefURI
                                  }
                                >
                                  {getLabwareCompatibleWithAdapter(
                                    loadName
                                  ).map(nestedDefUri => {
                                    const nestedDef = defs[nestedDefUri]

                                    return (
                                      <ListButtonRadioButton
                                        key={`${index}_${category}_${loadName}_${nestedDefUri}`}
                                        id={`${index}_${category}_${loadName}_${nestedDefUri}`}
                                        buttonText={
                                          nestedDef.metadata.displayName
                                        }
                                        buttonValue={nestedDefUri}
                                        onChange={e => {
                                          e.stopPropagation()
                                          setNestedSelectedLabwareDefURI(
                                            nestedDefUri
                                          )
                                        }}
                                        isSelected={
                                          nestedDefUri ===
                                          selectedNestedSelectedLabwareDefURI
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
  )
}
