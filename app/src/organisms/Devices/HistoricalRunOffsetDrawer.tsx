import * as React from 'react'
import isEqual from 'lodash/isEqual'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Box,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  BORDERS,
  JUSTIFY_FLEX_START,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { useProtocolDetailsForRun } from './hooks'
import { OffsetVector } from '../../molecules/OffsetVector'
import { getLabwareDefinition } from '../ReapplyOffsetsModal/hooks/useOffsetCandidatesForCurrentRun'
import type { RunData } from '@opentrons/api-client'

interface HistoricalRunOffsetDrawerProps {
  run: RunData
}

export function HistoricalRunOffsetDrawer(
  props: HistoricalRunOffsetDrawerProps
): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { run } = props
  const allLabwareOffsets = run.labwareOffsets?.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const uniqueLabwareOffsets = allLabwareOffsets?.filter(
    (offset, index, array) => {
      return (
        array.findIndex(
          firstOffset =>
            firstOffset.location.slotName === offset.location.slotName &&
            firstOffset.definitionUri === offset.definitionUri
        ) === index && !isEqual(offset.vector, { x: 0, y: 0, z: 0 })
      )
    }
  )

  const protocolDetails = useProtocolDetailsForRun(run.id)
  const labwareDetails = protocolDetails.protocolData?.labware

  if (uniqueLabwareOffsets == null || uniqueLabwareOffsets.length === 0) {
    return (
      <Box
        backgroundColor={COLORS.medGrey}
        width="100%"
        paddingY={SPACING.spacing4}
        paddingX={SPACING.spacing7}
      >
        <Box
          backgroundColor={COLORS.white}
          padding={SPACING.spacing5}
          textAlign="center"
        >
          <StyledText as="label">{t('no_offsets_available')}</StyledText>
        </Box>
      </Box>
    )
  }

  return (
    <Box
      backgroundColor={COLORS.medGrey}
      width="100%"
      padding={SPACING.spacing3}
    >
      <Flex
        justifyContent={JUSTIFY_FLEX_START}
        borderBottom={BORDERS.lineBorder}
        padding={SPACING.spacing3}
      >
        <StyledText
          marginLeft={SPACING.spacing5}
          width="24%"
          as="label"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
        >
          {t('location')}
        </StyledText>
        <StyledText
          as="label"
          width="33%"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
        >
          {t('labware')}
        </StyledText>
        <StyledText
          as="label"
          width="40%"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
        >
          {t('labware_offset_data')}
        </StyledText>
      </Flex>
      {uniqueLabwareOffsets.map((offset, index) => {
        let labwareName = offset.definitionUri
        console.log()
        if (labwareDetails != null) {
          labwareName =
            Object.values(labwareDetails)?.find(labware =>
              labware.definitionId.includes(offset.definitionUri)
            )?.displayName ?? offset.definitionUri
        }

        return (
          <Flex
            key={index}
            justifyContent={JUSTIFY_FLEX_START}
            padding={SPACING.spacing3}
            backgroundColor={COLORS.white}
            marginY={SPACING.spacing3}
            marginLeft={SPACING.spacing5}
          >
            <StyledText width="25%" as="label">
              {t('slot', { slotName: offset.location.slotName })}
              {offset.location.moduleModel != null &&
                ` - ${offset.location.moduleModel}`}
            </StyledText>
            <StyledText as="label" width="33%">
              {labwareName}
            </StyledText>
            <StyledText as="label" width="40%">
              <OffsetVector
                x={offset.vector.x}
                y={offset.vector.y}
                z={offset.vector.z}
              />
            </StyledText>
          </Flex>
        )
      })}
    </Box>
  )
}
