import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DeckInfoLabel,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_GRID,
  Flex,
  JUSTIFY_CENTER,
  OVERFLOW_AUTO,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'
import {
  getSlotInLocationStack,
  wellFillFromWellContents,
} from '@opentrons/step-generation'

import {
  LINE_CLAMP_TEXT_STYLE,
  NAV_BAR_HEIGHT_REM,
} from '/protocol-designer/components/atoms'
import {
  LabwareButtonBasket,
  LiquidButton,
} from '/protocol-designer/components/molecules'
import { selectors } from '/protocol-designer/labware-ingred/selectors'
import { selectors as stepFormSelectors } from '/protocol-designer/step-forms'
import {
  getInitialDeckSetup,
  getLiquidEntities,
} from '/protocol-designer/step-forms/selectors'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'
import {
  deselectWells,
  selectWells,
} from '/protocol-designer/well-selection/actions'
import { getSelectedWells } from '/protocol-designer/well-selection/selectors'

import { SelectableLabware } from '../Labware/SelectableLabware'
import { LiquidToolbox } from './LiquidToolbox'

import type { Dispatch, SetStateAction } from 'react'
import type { WellGroup } from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const CONTAINER_WIDTH = '49.8125rem'

interface AssignLiquidsModalData {
  nickNames: Record<string, string>
  labwareId: string | null
  selectedWells: WellGroup
  labware: Record<string, any>
  labwareEntities: Record<string, any>
  allWellContents: Record<string, any>
  liquidNamesById: Record<string, string>
  liquidDisplayColors: Record<string, string>
  // LiquidToolbox data
  liquids: any
  selectedWellGroups: any
  liquidLocations: any
  commonSelectedLiquidId: string | null
  commonSelectedVolume: number | null
  selectedWellsMaxVolume: number | null
  liquidSelectionOptions: any[]
  allWellContentsForActiveItem: any
}

interface AssignLiquidsModalProps {
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
  setDefineLiquidModal: Dispatch<SetStateAction<boolean>>
  data: AssignLiquidsModalData
}
export function AssignLiquidsModal(
  props: AssignLiquidsModalProps
): JSX.Element | null {
  const { showLiquidOverflowMenu, setDefineLiquidModal, data } = props
  const { t } = useTranslation('liquids')
  const [highlightedWells, setHighlightedWells] = useState<WellGroup | {}>({})
  const [showBadFormState, setShowBadFormState] = useState(false)
  const dispatch = useDispatch()

  const {
    nickNames,
    labwareId,
    selectedWells,
    labware,
    labwareEntities,
    allWellContents,
    liquidNamesById,
    liquidDisplayColors,
    // LiquidToolbox data
    liquids,
    selectedWellGroups,
    liquidLocations,
    commonSelectedLiquidId,
    commonSelectedVolume,
    selectedWellsMaxVolume,
    liquidSelectionOptions,
    allWellContentsForActiveItem,
  } = data

  const [selectedLabwareArray, setSelectedLabware] = useState<string[]>([
    labwareId ?? '',
  ])

  useEffect(() => {
    setSelectedLabware([labwareId ?? ''])
  }, [labwareId])

  const handleAssignToLabware = (newItem: string) => {
    setSelectedLabware(prevItems => [...prevItems, newItem])
  }

  if (labwareId == null) {
    console.assert(
      false,
      'No labware is selected, and no labwareId was given to AssignLiquidsModal'
    )
    return null
  }

  const labwareStack = labware[labwareId].stack
  const labwareDef = labwareEntities[labwareId]?.def
  const wellContents = allWellContents[labwareId]

  return (
    <Flex
      height={`calc(100vh - ${NAV_BAR_HEIGHT_REM}rem)`}
      backgroundColor={COLORS.grey10}
      gridGap={SPACING.spacing12}
      position={POSITION_RELATIVE}
    >
      <Flex
        width="100%"
        flexDirection={DIRECTION_COLUMN}
        overflow={OVERFLOW_AUTO}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gap={SPACING.spacing24}
          paddingTop={SPACING.spacing120}
          paddingBottom={SPACING.spacing60}
          paddingX={SPACING.spacing24}
          width="100%"
          minWidth="fit-content"
          alignItems={ALIGN_CENTER}
        >
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gap={SPACING.spacing24}
            width={CONTAINER_WIDTH}
          >
            <Flex
              width="100%"
              height="100%"
              alignItems={ALIGN_CENTER}
              gap={SPACING.spacing10}
            >
              <DeckInfoLabel
                size="large"
                deckLabel={
                  getSlotInLocationStack(labware[labwareId].stack) ?? ''
                }
              />
              <StyledText
                desktopStyle="headingLargeBold"
                css={LINE_CLAMP_TEXT_STYLE(3, true)}
              >
                {t('add_liquids_to_labware', {
                  labwareName: nickNames[labwareId],
                })}
              </StyledText>
            </Flex>
            <Flex flexDirection={DIRECTION_ROW} gap={SPACING.spacing24}>
              <Flex flexDirection={DIRECTION_COLUMN}>
                {labwareStack.length > 1 ? (
                  <Flex flexDirection={DIRECTION_COLUMN} width="224px">
                    <LabwareButtonBasket
                      stackOfLabware={labwareStack}
                      labware={labware}
                      setSelectedLabware={handleAssignToLabware}
                      selectedLabware={selectedLabwareArray}
                    />
                  </Flex>
                ) : null}
              </Flex>
              <Box
                width="100%"
                padding={`${SPACING.spacing32} ${SPACING.spacing48}`}
                backgroundColor={COLORS.white}
                borderRadius={BORDERS.borderRadius12}
                display={DISPLAY_GRID}
                gap={SPACING.spacing12}
              >
                <Flex flexDirection={DIRECTION_COLUMN} gap={SPACING.spacing16}>
                  <Flex
                    justifyContent={JUSTIFY_CENTER}
                    width="100%"
                    color={COLORS.grey60}
                  >
                    <StyledText
                      desktopStyle="headingSmallRegular"
                      css={{ userSelect: 'none' }}
                    >
                      {t('click_and_drag')}
                    </StyledText>
                  </Flex>
                  <SelectableLabware
                    showBorder={false}
                    labwareProps={{
                      wellLabelOption: WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE,
                      definition: labwareDef,
                      positioningMode: 'offsetInSlot',
                      highlightedWells,
                      wellFill: wellFillFromWellContents(
                        wellContents,
                        liquidDisplayColors
                      ),
                    }}
                    selectedPrimaryWells={selectedWells}
                    selectWells={(wells: WellGroup) =>
                      dispatch(selectWells(wells))
                    }
                    deselectWells={(wells: WellGroup) =>
                      dispatch(deselectWells(wells))
                    }
                    updateHighlightedWells={(wells: WellGroup) => {
                      setHighlightedWells(wells)
                    }}
                    ingredNames={liquidNamesById}
                    wellContents={wellContents}
                    nozzleType={null}
                  />
                </Flex>
              </Box>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
      <Flex
        height="100%"
        padding={SPACING.spacing12}
        position={POSITION_RELATIVE}
      >
        <Box
          position={POSITION_ABSOLUTE}
          top={SPACING.spacing12}
          right="100%"
          paddingRight={SPACING.spacing24}
        >
          <LiquidButton showLiquidOverflowMenu={showLiquidOverflowMenu} />
        </Box>
        <LiquidToolbox
          showBadFormState={showBadFormState}
          setShowBadFormState={setShowBadFormState}
          setDefineLiquidModal={setDefineLiquidModal}
          data={{
            liquids,
            labwareId,
            selectedWellGroups,
            nickNames,
            liquidLocations,
            commonSelectedLiquidId,
            commonSelectedVolume,
            selectedWellsMaxVolume,
            liquidSelectionOptions,
            allWellContentsForActiveItem,
          }}
        />
      </Flex>
    </Flex>
  )
}

interface AssignLiquidsModalContainerProps {
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
  setDefineLiquidModal: Dispatch<SetStateAction<boolean>>
}

export function AssignLiquidsModalContainer(
  props: AssignLiquidsModalContainerProps
): JSX.Element | null {
  const { showLiquidOverflowMenu, setDefineLiquidModal } = props

  // All selectors moved here
  const nickNames = useSelector(getLabwareNicknamesById)
  console.log('nickNames', nickNames)
  const labwareId = useSelector(selectors.getSelectedLabwareId)
  const selectedWells = useSelector(getSelectedWells)
  const { labware } = useSelector(getInitialDeckSetup)
  const labwareEntities = useSelector(stepFormSelectors.getLabwareEntities)
  const allWellContents = useSelector(
    wellContentsSelectors.getWellContentsAllLabware
  )
  const liquidNamesById = useSelector(selectors.getLiquidNamesById)
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)

  // LiquidToolbox selectors
  const liquids = useSelector(getLiquidEntities)
  const selectedWellGroups = useSelector(getSelectedWells)
  const liquidLocations = useSelector(selectors.getLiquidsByLabwareId)
  const commonSelectedLiquidId = useSelector(
    wellContentsSelectors.getSelectedWellsCommonIngredId
  )
  const commonSelectedVolume = useSelector(
    wellContentsSelectors.getSelectedWellsCommonVolume
  )
  const selectedWellsMaxVolume = useSelector(
    wellContentsSelectors.getSelectedWellsMaxVolume
  )
  const liquidSelectionOptions = useSelector(
    selectors.getLiquidSelectionOptions
  )
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )

  const data: AssignLiquidsModalData = {
    nickNames,
    labwareId: labwareId ?? null,
    selectedWells,
    labware,
    labwareEntities,
    allWellContents,
    liquidNamesById,
    liquidDisplayColors,
    // LiquidToolbox data
    liquids,
    selectedWellGroups,
    liquidLocations,
    commonSelectedLiquidId: commonSelectedLiquidId ?? null,
    commonSelectedVolume: commonSelectedVolume ?? null,
    selectedWellsMaxVolume: selectedWellsMaxVolume ?? null,
    liquidSelectionOptions,
    allWellContentsForActiveItem,
  }

  return (
    <AssignLiquidsModal
      showLiquidOverflowMenu={showLiquidOverflowMenu}
      setDefineLiquidModal={setDefineLiquidModal}
      data={data}
    />
  )
}
