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

import { getLiquidDisplay } from './getLiquidDisplay'
import { getLiquidIdsForStepSummary, getWellsForStepSummary } from './utils'

import type { ReactNode } from 'react'
import type {
  LabwareEntities,
  LiquidEntities,
  RobotState,
} from '@opentrons/step-generation'
import type { FormData } from '/protocol-designer/form-types'

interface MixSummaryProps {
  currentStep: FormData
  labwareNicknamesById: Record<string, string>
  liquidState: RobotState['liquidState']
  liquidEntities: LiquidEntities
  labwareEntities: LabwareEntities
}

export function MixSummary(props: MixSummaryProps): ReactNode {
  const {
    currentStep,
    labwareNicknamesById,
    liquidState,
    liquidEntities,
    labwareEntities,
  } = props
  const { t } = useTranslation('protocol_steps')
  const {
    labware: mixLabwareId,
    volume: mixVolume,
    times,
    wells: mix_wells,
  } = currentStep
  const mixLabwareDisplayName = labwareNicknamesById[mixLabwareId]
  const mixWells: string[] = mix_wells
  const liquidIds = getLiquidIdsForStepSummary(
    liquidState,
    mixLabwareId as string,
    mixWells
  )
  const liquidInfo = liquidIds.map(id => liquidEntities[id])
  const mixWellsDisplay = getWellsForStepSummary(
    mixWells,
    flatten(labwareEntities[mixLabwareId]?.def.ordering)
  )
  const liquidDisplay = getLiquidDisplay(liquidInfo, t)
  return (
    <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER} flexWrap={WRAP}>
      <StyledText desktopStyle="bodyDefaultRegular">{t('mixing')}</StyledText>
      <Tag
        type="default"
        text={`${mixVolume as string} ${t('application:units.microliter')}`}
      />
      {liquidDisplay}
      <StyledText desktopStyle="bodyDefaultRegular">
        {t('time_in', { times })}
      </StyledText>
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {t('wells_in_labware', {
          well: mixWellsDisplay,
          labware: mixLabwareDisplayName,
        })}
      </StyledText>
    </Flex>
  )
}
