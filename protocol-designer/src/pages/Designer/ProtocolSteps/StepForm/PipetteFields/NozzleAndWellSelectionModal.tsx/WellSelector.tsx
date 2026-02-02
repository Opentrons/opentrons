import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  INACCESSIBLE,
  SPACING,
  StyledText,
  UNSELECTED,
  WELL,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  getPositionFromSlotId,
} from '@opentrons/shared-data'
import {
  getIsSafePipetteMovement,
  getSlotInLocationStack,
} from '@opentrons/step-generation'

import { LabwareOnDeck } from '/protocol-designer/components/organisms'
import { getInvariantContext } from '/protocol-designer/step-forms/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import { BaseDeckTipSelection } from '../TipSelectionWizard/BaseDeckTipSelection'
import { DeckOverlay } from '../TipSelectionWizard/DeckOverlay'
import { SelectionLegend } from '../TipSelectionWizard/SelectionLegend'
import { getViewboxFromSelectedLabware } from '../TipSelectionWizard/utils'

import type { WellType } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  RobotType,
} from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'
import type { FieldPropsByName } from '../../types'

interface WellSelectorProps {
  deckSetup: AllTemporalPropertiesForTimelineFrame
  propsForFields: FieldPropsByName
  stepType: string
  robotType: RobotType
  nozzleConfiguration: NozzleConfigurationStyle
}
export function WellSelector(props: WellSelectorProps): JSX.Element {
  const { t } = useTranslation('protocol_steps')
  const {
    deckSetup,
    propsForFields,
    stepType,
    robotType,
    nozzleConfiguration,
  } = props
  const pipetteId = propsForFields.pipette.value as string
  const robotState = useSelector(getRobotStateAtActiveItem)
  const invariantContext = useSelector(getInvariantContext)
  const isAspirate = stepType === 'aspirate'
  const isDispense = stepType === 'dispense'
  const isMix = stepType === 'mix'

  const handleClickWell = (wellName: string): void => {
    console.log('well name', wellName)
  }
  let labwareId: string

  switch (stepType) {
    case 'aspirate':
      labwareId = propsForFields.aspirate_labware.value as string
      break
    case 'dispense':
      labwareId = propsForFields.dispense_labware.value as string
      break
    case 'mix':
      labwareId = propsForFields.labware.value as string
      break
    default:
      labwareId = ''
  }

  let controls: JSX.Element = <></>

  const labware = deckSetup.labware[labwareId]
  const labwareDef = labware.def

  const allWells = labwareDef.ordering.flat()
  const slot = getSlotInLocationStack(labware.stack)
  const deckDef = getDeckDefFromRobotType(robotType)

  const slotPosition = getPositionFromSlotId(slot, deckDef)
  const displayName = labwareDef.metadata.displayName

  const viewBox = getViewboxFromSelectedLabware(labwareId, deckSetup, deckDef)
  if (slotPosition == null || labwareId == null || labware == null) {
    console.warn(`no slot position for selected tiprack ${labwareId}`)
    controls = <></>
  } else if (robotState === null) {
    console.warn(`no robot state so unable to determine well accessibility`)
  } else {
    const allWellsWithStatus = allWells.reduce<Record<string, number>>(
      (acc, key) => {
        acc[key] = getIsSafePipetteMovement({
          robotState,
          invariantContext,
          pipetteId,
          labwareId,
          wellTargetName: key,
          primaryNozzle: 'A1',
          nozzleConfiguration,
        })
          ? 0
          : 1
        return acc
      },
      {}
    )
    const allWellsWithState = allWells.reduce<Record<string, WellType>>(
      (acc, key) => {
        acc[key] = getIsSafePipetteMovement({
          robotState,
          invariantContext,
          pipetteId,
          labwareId,
          wellTargetName: key,
          primaryNozzle: 'A1',
          nozzleConfiguration,
        })
          ? UNSELECTED
          : INACCESSIBLE
        return acc
      },
      {}
    )
    console.log('🚀 ~ WellSelector ~ allWellsWithState:', allWellsWithState)

    controls = (
      <>
        <DeckOverlay deckDef={deckDef} />
        <LabwareOnDeck
          labwareOnDeck={labware}
          x={slotPosition[0]}
          y={slotPosition[1]}
          showHighlightedWells={false}
          handleClickWell={handleClickWell}
          selectedTipsByIndex={allWellsWithStatus}
          {...{ statusByWellName: allWellsWithState }}
          fill={COLORS.white}
          ignoreMissingTips
        />
      </>
    )
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex padding={SPACING.spacing20}>
        {isMix ? (
          <StyledText desktopStyle={'headingMediumBold'}>
            {t('select_wells_to_mix_liquid_in', {
              labware: displayName,
            })}
          </StyledText>
        ) : null}
        {isAspirate ? (
          <StyledText desktopStyle={'headingMediumBold'}>
            {t('select_wells_to_aspirate_liquid_from', {
              labware: displayName,
            })}
          </StyledText>
        ) : null}

        {isDispense ? (
          <StyledText desktopStyle={'headingMediumBold'}>
            {t('select_wells_to_dispense_liquid_into', {
              labware: displayName,
            })}
          </StyledText>
        ) : null}
      </Flex>

      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        padding={SPACING.spacing20}
      >
        <BaseDeckTipSelection controls={controls} viewBox={viewBox} />
        <Box width={'160px'}>
          <SelectionLegend
            selectionType={WELL}
            labwareDefinition={labwareDef}
          />
        </Box>
      </Flex>
    </Flex>
  )
}
