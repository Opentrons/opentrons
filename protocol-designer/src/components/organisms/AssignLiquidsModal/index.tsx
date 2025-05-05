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
import { LiquidButton } from '../../molecules'
import { SelectableLabware } from '../Labware/SelectableLabware'
import { wellFillFromWellContents } from '../LabwareOnDeck/utils'
import { LiquidEditor } from './LiquidEditor'

import type { Dispatch, SetStateAction } from 'react'
import type { WellGroup } from '@opentrons/components'

const LIQUID_BOX_WIDTH = '52rem'

interface AssignLiquidsModalProps {
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
}
export function AssignLiquidsModal(
  props: AssignLiquidsModalProps
): JSX.Element | null {
  const { showLiquidOverflowMenu } = props
  const { t } = useTranslation(['liquids', 'shared'])
  const [highlightedWells, setHighlightedWells] = useState<WellGroup | {}>({})
  const navigate = useNavigate()
  const nickNames = useSelector(getLabwareNicknamesById)
  const labwareId = useSelector(selectors.getSelectedLabwareId)
  const selectedWells = useSelector(getSelectedWells)
  const dispatch = useDispatch()
  const labwareEntities = useSelector(stepFormSelectors.getLabwareEntities)
  const allWellContents = useSelector(
    wellContentsSelectors.getWellContentsAllLabware
  )
  const liquidNamesById = useSelector(selectors.getLiquidNamesById)
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  const { labware } = useSelector(getInitialDeckSetup)
  const [showBadFormState, setShowBadFormState] = useState(false)

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
      height="100%"
      backgroundColor={COLORS.grey10}
      paddingBottom={SPACING.spacing40}
      gridGap={SPACING.spacing40}
      flexDirection={DIRECTION_COLUMN}
    >
      <Flex
        padding={`${SPACING.spacing12} ${SPACING.spacing12} 0`}
        justifyContent={JUSTIFY_END}
        gap={SPACING.spacing8}
      >
        <LiquidButton showLiquidOverflowMenu={showLiquidOverflowMenu} />
        <PrimaryButton onClick={handleSave}>{t('shared:done')}</PrimaryButton>
      </Flex>
      <Flex
        width="100%"
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        gap={SPACING.spacing8}
      >
        <DeckInfoLabel
          deckLabel={getSlotInLocationStack(labware[labwareId].stack) ?? ''}
        />
        <StyledText desktopStyle="headingLargeBold">
          {t('add_liquids_to_labware', { labwareName: nickNames[labwareId] })}
        </StyledText>
      </Flex>
      <Flex
        width="100%"
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        <Flex paddingX={SPACING.spacing40} gap={SPACING.spacing24}>
          <Box
            padding={`${SPACING.spacing32} ${SPACING.spacing48}`}
            backgroundColor={COLORS.white}
            borderRadius={BORDERS.borderRadius12}
            display={DISPLAY_GRID}
            gap={SPACING.spacing12}
            width={LIQUID_BOX_WIDTH}
            minWidth={LIQUID_BOX_WIDTH}
          >
            <Flex
              justifyContent={JUSTIFY_CENTER}
              width="100%"
              color={COLORS.grey60}
            >
              <StyledText
                desktopStyle="headingSmallBold"
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
          <Flex width="100%">
            <LiquidEditor
              showBadFormState={showBadFormState}
              setShowBadFormState={setShowBadFormState}
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
