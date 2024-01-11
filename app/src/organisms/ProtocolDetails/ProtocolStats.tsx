import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  SIZE_AUTO,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getPipetteNameSpecs,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'

interface ProtocolStatsProps {
  analysis: ProtocolAnalysisOutput | null
}

export const ProtocolStats = (
  props: ProtocolStatsProps
): JSX.Element | null => {
  const { analysis } = props
  const { t } = useTranslation('protocol_details')
  if (analysis == null) return null
  const HIDE_SCROLLBAR = css`
    ::-webkit-scrollbar {
      display: none;
    }
  `
  const gripperMoveCount: StatRowProps = {
    displayName: t('gripper_pick_up_count'),
    description: t('gripper_pick_up_count_description'),
    datum: analysis.commands.reduce(
      (acc, c) =>
        c.commandType === 'moveLabware' && c.params.strategy === 'usingGripper'
          ? acc + 1
          : acc,
      0
    ),
  }

  const pickUpTipCountsByPipetteId = analysis.commands.reduce<{
    [pipetteId: string]: number
  }>(
    (acc, c) =>
      c.commandType === 'pickUpTip'
        ? { ...acc, [c.params.pipetteId]: (acc?.[c.params.pipetteId] ?? 0) + 1 }
        : acc,
    {}
  )
  const pipettePickUpStats = Object.entries(pickUpTipCountsByPipetteId).map(
    ([pipetteId, pickUpCount]) => {
      const pipetteName = analysis.pipettes.find(p => p.id === pipetteId)
        ?.pipetteName
      const displayName =
        pipetteName != null
          ? getPipetteNameSpecs(pipetteName)?.displayName ?? pipetteName
          : pipetteId
      return {
        displayName: t('pipette_pick_up_count', { pipette: displayName }),
        description: t('pipette_pick_up_count_description'),
        datum: pickUpCount,
      }
    }
  )

  const aspirateCountsByPipetteId = analysis.commands.reduce<{
    [pipetteId: string]: number
  }>(
    (acc, c) =>
      c.commandType === 'aspirate'
        ? { ...acc, [c.params.pipetteId]: (acc?.[c.params.pipetteId] ?? 0) + 1 }
        : acc,
    {}
  )
  const pipetteAspirateStats = Object.entries(aspirateCountsByPipetteId).map(
    ([pipetteId, pickUpCount]) => {
      const pipetteName = analysis.pipettes.find(p => p.id === pipetteId)
        ?.pipetteName
      const displayName =
        pipetteName != null
          ? getPipetteNameSpecs(pipetteName)?.displayName ?? pipetteName
          : pipetteId
      return {
        displayName: t('pipette_aspirate_count', { pipette: displayName }),
        description: t('pipette_aspirate_count_description'),
        datum: pickUpCount,
      }
    }
  )

  const dispenseCountsByPipetteId = analysis.commands.reduce<{
    [pipetteId: string]: number
  }>(
    (acc, c) =>
      c.commandType === 'dispense'
        ? { ...acc, [c.params.pipetteId]: (acc?.[c.params.pipetteId] ?? 0) + 1 }
        : acc,
    {}
  )
  const pipetteDispenseStats = Object.entries(dispenseCountsByPipetteId).map(
    ([pipetteId, pickUpCount]) => {
      const pipetteName = analysis.pipettes.find(p => p.id === pipetteId)
        ?.pipetteName
      const displayName =
        pipetteName != null
          ? getPipetteNameSpecs(pipetteName)?.displayName ?? pipetteName
          : pipetteId
      return {
        displayName: t('pipette_dispense_count', { pipette: displayName }),
        description: t('pipette_dispense_count_description'),
        datum: pickUpCount,
      }
    }
  )

  // NOTE: logging data as JSON for quick copying
  const toRawStat = (
    row: StatRowProps
  ): { [stat: string]: number | string } => ({
    [row.displayName]: row.datum,
  })
  console.info(
    JSON.stringify({
      [analysis.metadata?.protocolName]: {
        ...toRawStat(gripperMoveCount),
        ...pipettePickUpStats.reduce(
          (acc, r) => ({ ...acc, ...toRawStat(r) }),
          {}
        ),
        ...pipetteAspirateStats.reduce(
          (acc, r) => ({ ...acc, ...toRawStat(r) }),
          {}
        ),
        ...pipetteDispenseStats.reduce(
          (acc, r) => ({ ...acc, ...toRawStat(r) }),
          {}
        ),
      },
    })
  )
  return (
    <Flex
      css={HIDE_SCROLLBAR}
      flexDirection={DIRECTION_COLUMN}
      maxHeight="25rem"
      overflowY="auto"
    >
      <Flex flexDirection={DIRECTION_COLUMN} marginY={SPACING.spacing16}>
        {[
          gripperMoveCount,
          ...pipettePickUpStats,
          ...pipetteAspirateStats,
          ...pipetteDispenseStats,
        ].map(({ displayName, description, datum }) => (
          <StatRow key={displayName} {...{ displayName, description, datum }} />
        ))}
      </Flex>
    </Flex>
  )
}

interface StatRowProps {
  displayName: string
  description: string
  datum: string | number
}

export const StatRow = (props: StatRowProps): JSX.Element => {
  const { displayName, description, datum } = props
  return (
    <Flex flexDirection={DIRECTION_ROW}>
      <Flex flexDirection={DIRECTION_COLUMN} justifyContent={JUSTIFY_CENTER}>
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginX={SPACING.spacing16}
        >
          {displayName}
        </StyledText>
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.grey50Enabled}
          marginX={SPACING.spacing16}
        >
          {description}
        </StyledText>
      </Flex>
      <Flex
        backgroundColor={COLORS.darkBlackEnabled + '1A'}
        borderRadius={BORDERS.radiusSoftCorners}
        height="max-content"
        paddingY={SPACING.spacing4}
        paddingX={SPACING.spacing8}
        alignSelf={ALIGN_CENTER}
        marginLeft={SIZE_AUTO}
      >
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightRegular}>
          {datum}
        </StyledText>
      </Flex>
    </Flex>
  )
}
