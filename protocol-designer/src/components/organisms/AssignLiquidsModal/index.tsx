import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DeckInfoLabel,
  DIRECTION_COLUMN,
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
import { LiquidButton } from '/protocol-designer/components/molecules'
import { selectors } from '/protocol-designer/labware-ingred/selectors'
import { selectors as stepFormSelectors } from '/protocol-designer/step-forms'
import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'
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

const CONTAINER_WIDTH = '49.8125rem'

interface AssignLiquidsModalProps {
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
  setDefineLiquidModal: Dispatch<SetStateAction<boolean>>
}
export function AssignLiquidsModal(
  props: AssignLiquidsModalProps
): JSX.Element | null {
  const { showLiquidOverflowMenu, setDefineLiquidModal } = props
  const { t } = useTranslation('liquids')
  const [highlightedWells, setHighlightedWells] = useState<WellGroup | {}>({})
  const [showBadFormState, setShowBadFormState] = useState(false)
  const nickNames = useSelector(getLabwareNicknamesById)
  const labwareId = useSelector(selectors.getSelectedLabwareId)
  const selectedWells = useSelector(getSelectedWells)
  const dispatch = useDispatch()
  const { labware } = useSelector(getInitialDeckSetup)
  const labwareEntities = useSelector(stepFormSelectors.getLabwareEntities)
  const allWellContents = useSelector(
    wellContentsSelectors.getWellContentsAllLabware
  )
  const liquidNamesById = useSelector(selectors.getLiquidNamesById)
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)

  if (labwareId == null) {
    console.assert(
      false,
      'No labware is selected, and no labwareId was given to AssignLiquidsModal'
    )
    return null
  }

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
                css={LINE_CLAMP_TEXT_STYLE(3)}
              >
                {t('add_liquids_to_labware', {
                  labwareName: nickNames[labwareId],
                })}
              </StyledText>
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
        />
      </Flex>
    </Flex>
  )
}
