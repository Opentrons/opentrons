import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

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
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SPACING,
  StyledText,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { selectors } from '../../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { getInitialDeckSetup } from '../../../step-forms/selectors'
import * as wellContentsSelectors from '../../../top-selectors/well-contents'
import { getLabwareNicknamesById } from '../../../ui/labware/selectors'
import {
  deselectAllWells,
  deselectWells,
  selectWells,
} from '../../../well-selection/actions'
import { getSelectedWells } from '../../../well-selection/selectors'
import { LINE_CLAMP_TEXT_STYLE, NAV_BAR_HEIGHT_REM } from '../../atoms'
import { LiquidButton } from '../../molecules'
import { SelectableLabware } from '../Labware/SelectableLabware'
import { wellFillFromWellContents } from '../LabwareOnDeck/utils'
import { LiquidToolbox } from './LiquidToolbox'

import type { Dispatch, SetStateAction } from 'react'
import type { WellGroup } from '@opentrons/components'

interface AssignLiquidsModalProps {
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
}
export function AssignLiquidsModal(
  props: AssignLiquidsModalProps
): JSX.Element | null {
  const { showLiquidOverflowMenu } = props
  const { t } = useTranslation('liquids')
  const [highlightedWells, setHighlightedWells] = useState<WellGroup | {}>({})
  const [showBadFormState, setShowBadFormState] = useState(false)
  const navigate = useNavigate()
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

  const handleSave = (): void => {
    if (Object.keys(selectedWells).length > 0) {
      setShowBadFormState(true)
    } else {
      dispatch(deselectAllWells())
      setShowBadFormState(false)
      navigate('/designer')
    }
  }

  return (
    <Flex
      height={`calc(100vh - ${NAV_BAR_HEIGHT_REM}rem)`}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      backgroundColor={COLORS.grey10}
      gridGap={SPACING.spacing12}
    >
      <Flex
        width="100%"
        flexDirection={DIRECTION_COLUMN}
        paddingX={SPACING.spacing24}
      >
        <Flex justifyContent={JUSTIFY_END} paddingTop={SPACING.spacing12}>
          <LiquidButton showLiquidOverflowMenu={showLiquidOverflowMenu} />
        </Flex>
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          css={{ outline: '1px solid blue' }}
          flexDirection={DIRECTION_COLUMN}
          gap={SPACING.spacing24}
        >
          <Flex
            width="100%"
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
            gap={SPACING.spacing8}
          >
            <DeckInfoLabel
              deckLabel={getSlotInLocationStack(labware[labwareId].stack) ?? ''}
            />
            <StyledText
              desktopStyle="headingLargeBold"
              css={LINE_CLAMP_TEXT_STYLE(2)}
            >
              {t('add_liquids_to_labware', {
                labwareName: nickNames[labwareId],
              })}
            </StyledText>
          </Flex>
          <Box
            width="50vw"
            padding={SPACING.spacing60}
            backgroundColor={COLORS.white}
            borderRadius={BORDERS.borderRadius12}
            display={DISPLAY_GRID}
            gap={SPACING.spacing12}
          >
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
                highlightedWells,
                wellFill: wellFillFromWellContents(
                  wellContents,
                  liquidDisplayColors
                ),
              }}
              selectedPrimaryWells={selectedWells}
              selectWells={(wells: WellGroup) => dispatch(selectWells(wells))}
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
          </Box>
          <PrimaryButton width="20rem" onClick={handleSave}>
            {t('shared:done')}
          </PrimaryButton>
        </Flex>
      </Flex>
      <Flex padding={SPACING.spacing12}>
        <LiquidToolbox
          showBadFormState={showBadFormState}
          setShowBadFormState={setShowBadFormState}
        />
      </Flex>
    </Flex>
  )
}
