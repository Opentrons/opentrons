import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { clsx } from 'clsx'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_GRID,
  Flex,
  JUSTIFY_CENTER,
  OVERFLOW_AUTO,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  RobotInfoLabel,
  SPACING,
  StyledText,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'
import {
  getSlotInLocationStack,
  HOPPER_STACKER_LOCATION,
  wellFillFromWellContents,
} from '@opentrons/step-generation'

import { NAV_BAR_HEIGHT_REM } from '/protocol-designer/components/atoms'
import { LiquidButton } from '/protocol-designer/components/molecules'
import { selectors } from '/protocol-designer/labware-ingred/selectors'
import { selectors as stepFormSelectors } from '/protocol-designer/step-forms'
import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'
import lineClampStyles from '/protocol-designer/styles/lineclamp.module.css'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'
import {
  deselectWells,
  selectWells,
} from '/protocol-designer/well-selection/actions'
import { getSelectedWells } from '/protocol-designer/well-selection/selectors'

import { SelectableLabware } from '../Labware/SelectableLabware'
import { LiquidLayoutOverlayModalContainer } from '../OverlayModal/LiquidsOverlayModal'
import { LabwareStackToolboxContainer } from './LabwareToolbox'
import { LiquidToolboxContainer } from './LiquidToolbox'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { WellGroup } from '@opentrons/components'
import type {
  ContentsByWell,
  LabwareEntities,
} from '@opentrons/step-generation'
import type { LabwareOnDeck } from '/protocol-designer/step-forms'

const CONTAINER_WIDTH = '49.8125rem'

interface AssignLiquidsModalData {
  selectedLabwareIds: string[] | null
  nickNames: Record<string, string>
  labwareId: string | null
  selectedWells: WellGroup
  labware: {
    [labwareId: string]: LabwareOnDeck
  }
  labwareEntities: LabwareEntities
  allWellContents: Record<string, any>
  liquidNamesById: Record<string, string>
  liquidDisplayColors: Record<string, string>
}

interface AssignLiquidsModalProps {
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
  setDefineLiquidModal: Dispatch<SetStateAction<boolean>>
  assignLiquidsModalData: AssignLiquidsModalData
}
export function AssignLiquidsModal(props: AssignLiquidsModalProps): ReactNode {
  const {
    showLiquidOverflowMenu,
    setDefineLiquidModal,
    assignLiquidsModalData: data,
  } = props
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
    selectedLabwareIds,
  } = data

  const [showLiquidLayoutOverlay, setShowLiquidLayoutOverlay] = useState(false)

  if (labwareId === null) {
    console.assert(
      false,
      'No labware is selected, and no labwareId was given to AssignLiquidsModal'
    )
    return null
  }

  const labwareStack = labware[labwareId].stack
  const labwareDef = labwareEntities[labwareId]?.def
  const wellContents = allWellContents[labwareId]

  const selectableLabwareProps: {
    wellLabelOption: typeof WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE
    definition: typeof labwareDef
    positioningMode: 'offsetInSlot'
    highlightedWells: WellGroup
    wellFill: Record<string, string>
  } = {
    wellLabelOption: WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE,
    definition: labwareDef,
    positioningMode: 'offsetInSlot',
    highlightedWells,
    wellFill: wellFillFromWellContents(
      wellContents as ContentsByWell,
      liquidDisplayColors
    ),
  }

  const labwareIsOnHopper = labwareStack.includes(HOPPER_STACKER_LOCATION)

  return (
    <Flex
      height={`calc(100vh - ${NAV_BAR_HEIGHT_REM}rem)`}
      backgroundColor={COLORS.grey10}
      gridGap={SPACING.spacing12}
      position={POSITION_RELATIVE}
    >
      <Flex width="100%" overflow={OVERFLOW_AUTO} padding={SPACING.spacing16}>
        {labwareIsOnHopper && labwareStack.length > 1 ? (
          <LabwareStackToolboxContainer
            setShowLiquidLayoutOverlay={setShowLiquidLayoutOverlay}
            selectedLabwareIds={selectedLabwareIds ?? null}
            showBadFormState={showBadFormState}
            setShowBadFormState={setShowBadFormState}
            setDefineLiquidModal={setDefineLiquidModal}
          />
        ) : null}
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
              height="100%"
              alignItems={ALIGN_CENTER}
              gap={SPACING.spacing10}
            >
              <RobotInfoLabel
                size="extraLarge"
                deckLabel={
                  getSlotInLocationStack(
                    labware[labwareId].stack,
                    labwareIsOnHopper
                  ) ?? ''
                }
              />
              <StyledText
                desktopStyle="headingLargeBold"
                className={clsx(
                  lineClampStyles.line_clamp,
                  lineClampStyles.word_normal
                )}
                style={{ WebkitLineClamp: 3 }}
              >
                {t('add_liquids_to_labware', {
                  labwareName: nickNames[labwareId],
                })}
              </StyledText>
            </Flex>
            <Flex
              flexDirection={DIRECTION_ROW}
              gap={SPACING.spacing24}
              position={POSITION_RELATIVE}
            >
              {showLiquidLayoutOverlay && (
                <LiquidLayoutOverlayModalContainer
                  showLiquidOverflowMenu={setShowLiquidLayoutOverlay}
                />
              )}
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
                      style={{ userSelect: 'none' }}
                    >
                      {t('click_and_drag')}
                    </StyledText>
                  </Flex>
                  <SelectableLabware
                    showBorder={false}
                    labwareProps={selectableLabwareProps}
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
        <LiquidToolboxContainer
          showBadFormState={showBadFormState}
          setShowBadFormState={setShowBadFormState}
          setDefineLiquidModal={setDefineLiquidModal}
          showLiquidLayoutOverlay={showLiquidLayoutOverlay}
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
): ReactNode {
  const { showLiquidOverflowMenu, setDefineLiquidModal } = props

  // All selectors moved here
  const nickNames = useSelector(getLabwareNicknamesById)
  const selectedLabwareId = useSelector(selectors.getSelectedLabwareId)
  const selectedWells = useSelector(getSelectedWells)
  const { labware } = useSelector(getInitialDeckSetup)
  const labwareEntities = useSelector(stepFormSelectors.getLabwareEntities)
  const selectedLabwareIds = useSelector(selectors.getSelectedLabwareIds)
  // TODO(tz, 2026-01-12): change this to use liquid locations instead of this method and remove getWellContentsForLabwareStack method
  const allWellContents = useSelector(
    wellContentsSelectors.getWellContentsForLabwareStack
  )
  const liquidNamesById = useSelector(selectors.getLiquidNamesById)
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)

  const data: AssignLiquidsModalData = {
    nickNames,
    labwareId: selectedLabwareId ?? null,
    selectedWells,
    labware,
    labwareEntities,
    allWellContents,
    liquidNamesById,
    liquidDisplayColors,
    selectedLabwareIds: selectedLabwareIds ?? null,
  }

  return (
    <AssignLiquidsModal
      showLiquidOverflowMenu={showLiquidOverflowMenu}
      setDefineLiquidModal={setDefineLiquidModal}
      assignLiquidsModalData={data}
    />
  )
}
