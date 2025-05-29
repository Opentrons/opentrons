import { useTranslation } from 'react-i18next'
import flatten from 'lodash/flatten'

import {
  ALIGN_CENTER,
  Flex,
  SPACING,
  StyledText,
  Tag,
  WRAP,
} from '@opentrons/components'
import { AIR } from '@opentrons/step-generation'

import { getLiquidDisplay } from './getLiquidDisplay'
import { getWellsForStepSummary } from './utils'

import type {
  AdditionalEquipmentEntities,
  LabwareEntities,
  LiquidEntities,
  RobotState,
} from '@opentrons/step-generation'
import type { FormData } from '../../../form-types'

interface MoveLiquidSummaryProps {
  currentStep: FormData
  labwareNicknamesById: Record<string, string>
  liquidState: RobotState['liquidState']
  liquidEntities: LiquidEntities
  labwareEntities: LabwareEntities
  additionalEquipmentEntities: AdditionalEquipmentEntities
}

export function MoveLiquidSummary(props: MoveLiquidSummaryProps): JSX.Element {
  const {
    currentStep,
    labwareNicknamesById,
    liquidState,
    liquidEntities,
    labwareEntities,
    additionalEquipmentEntities,
  } = props
  const { t } = useTranslation('protocol_steps')
  const {
    aspirate_labware,
    aspirate_wells,
    dispense_wells,
    dispense_labware,
    volume,
    path,
  } = currentStep
  let moveLiquidType
  const sourceLabwareName = labwareNicknamesById[aspirate_labware]
  const destinationLabwareName = labwareNicknamesById[dispense_labware]
  const aspirateWells: string[] = aspirate_wells
  const aspirateWellsDisplay = getWellsForStepSummary(
    aspirateWells,
    flatten(labwareEntities[aspirate_labware]?.def.ordering)
  )
  const dispenseWellsDisplay = getWellsForStepSummary(
    dispense_wells as string[],
    flatten(labwareEntities[dispense_labware]?.def.ordering)
  )

  const disposalName = additionalEquipmentEntities[dispense_labware]?.name

  const isDisposalLocation =
    disposalName === 'wasteChute' || disposalName === 'trashBin'

  if (path === 'single') {
    moveLiquidType = 'transfer'
  } else if (path === 'multiAspirate') {
    moveLiquidType = 'consolidate'
  } else {
    moveLiquidType = 'distribute'
  }

  const liquidIds = Array.from(
    aspirateWells.reduce<Set<string>>((acc, well) => {
      for (const [liquidId, { volume }] of Object.entries(
        liquidState.labware[aspirate_labware][well]
      )) {
        if (liquidId !== AIR && volume > 0) {
          acc.add(liquidId)
        }
      }
      return acc
    }, new Set<string>())
  )

  const liquidInfo = liquidIds.map(id => liquidEntities[id])
  const liquidDisplay = getLiquidDisplay(liquidInfo, t)

  return (
    <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER} flexWrap={WRAP}>
      <StyledText desktopStyle="bodyDefaultRegular">
        {t(moveLiquidType)}
      </StyledText>
      <Tag
        type="default"
        text={`${volume as string} ${t('application:units.microliter')}`}
      />
      {liquidDisplay}
      <StyledText desktopStyle="bodyDefaultRegular">{t('from')}</StyledText>
      {moveLiquidType === 'consolidate' ? (
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('wells_of', { wells: aspirateWellsDisplay })}
        </StyledText>
      ) : null}
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {t('labware_to', { labware: sourceLabwareName })}
      </StyledText>
      {moveLiquidType === 'distribute' ? (
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('wells_of', { wells: dispenseWellsDisplay })}
        </StyledText>
      ) : null}
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {isDisposalLocation
          ? t(`shared:${disposalName}`)
          : destinationLabwareName}
      </StyledText>
    </Flex>
  )
}
