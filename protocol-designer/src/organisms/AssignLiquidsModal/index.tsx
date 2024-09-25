import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'
import { selectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import * as wellContentsSelectors from '../../top-selectors/well-contents'
import { getSelectedWells } from '../../well-selection/selectors'
import {
  SelectableLabware,
  wellFillFromWellContents,
} from '../../components/labware'
import { deselectWells, selectWells } from '../../well-selection/actions'
import { LiquidToolbox } from './LiquidToolbox'

import type { WellGroup } from '@opentrons/components'

export function AssignLiquidsModal(): JSX.Element | null {
  const { t } = useTranslation('liquids')
  const [highlightedWells, setHighlightedWells] = useState<WellGroup | {}>({})
  const navigate = useNavigate()
  const labwareId = useSelector(selectors.getSelectedLabwareId)
  const selectedWells = useSelector(getSelectedWells)
  const dispatch = useDispatch()
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
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      backgroundColor={COLORS.grey10}
    >
      <Flex
        justifyContent={JUSTIFY_CENTER}
        width="80%"
        alignItems={ALIGN_CENTER}
        height="calc(100vh - 64px)"
      >
        <Box
          width="80vh"
          height="max-content"
          padding={SPACING.spacing60}
          backgroundColor={COLORS.white}
          borderRadius={BORDERS.borderRadius12}
        >
          <Flex
            marginBottom={SPACING.spacing12}
            justifyContent={JUSTIFY_CENTER}
            width="100%"
            color={COLORS.grey60}
          >
            <StyledText desktopStyle="headingSmallRegular">
              {t('click_and_drag')}
            </StyledText>
          </Flex>
          <SelectableLabware
            showBorder={false}
            labwareProps={{
              wellLabelOption: WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE,
              definition: labwareDef,
              highlightedWells: highlightedWells,
              wellFill: wellFillFromWellContents(
                wellContents,
                liquidDisplayColors
              ),
            }}
            selectedPrimaryWells={selectedWells}
            selectWells={(wells: WellGroup) => dispatch(selectWells(wells))}
            deselectWells={(wells: WellGroup) => dispatch(deselectWells(wells))}
            updateHighlightedWells={(wells: WellGroup) => {
              setHighlightedWells(wells)
            }}
            ingredNames={liquidNamesById}
            wellContents={wellContents}
            nozzleType={null}
          />
        </Box>
      </Flex>
      <LiquidToolbox
        onClose={() => {
          navigate('/designer')
        }}
      />
    </Flex>
  )
}
