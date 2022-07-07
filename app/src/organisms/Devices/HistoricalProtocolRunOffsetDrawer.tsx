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
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import { useProtocolDetailsForRun, useDeckCalibrationData } from './hooks'
import { OffsetVector } from '../../molecules/OffsetVector'
import type { RunData } from '@opentrons/api-client'

interface HistoricalProtocolRunOffsetDrawerProps {
  run: RunData
  robotName: string
}

export function HistoricalProtocolRunOffsetDrawer(
  props: HistoricalProtocolRunOffsetDrawerProps
): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { run, robotName } = props
  const [showOutOfDateBanner, setShowOutOfDateBanner] = React.useState(false)
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

  const deckCalibrationData = useDeckCalibrationData(robotName)
    .deckCalibrationData
  const lastModifiedDeckCal =
    deckCalibrationData != null && 'lastModified' in deckCalibrationData
      ? deckCalibrationData.lastModified
      : null
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
  if (
    typeof lastModifiedDeckCal === 'string' &&
    new Date(lastModifiedDeckCal).getTime() >
      new Date(
        uniqueLabwareOffsets[uniqueLabwareOffsets?.length - 1].createdAt
      ).getTime()
  ) {
    setShowOutOfDateBanner(true)
  }

  return (
    <Box
      backgroundColor={COLORS.medGrey}
      width="100%"
      padding={SPACING.spacing3}
    >
      {showOutOfDateBanner && (
        <Banner
          type="warning"
          marginLeft={SPACING.spacing5}
          marginTop={SPACING.spacing3}
        >
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {t('data_out_of_date')}
            </StyledText>
            <StyledText as="p">{t('robot_was_recalibrated')}</StyledText>
          </Flex>
        </Banner>
      )}
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
          dataTest-id={`RecentProtocolRun_OffsetDrawer_locationTitle`}
        >
          {t('location')}
        </StyledText>
        <StyledText
          as="label"
          width="33%"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          dataTest-id={`RecentProtocolRun_OffsetDrawer_labwareTitle`}
        >
          {t('labware')}
        </StyledText>
        <StyledText
          as="label"
          width="40%"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          dataTest-id={`RecentProtocolRun_OffsetDrawer_labwareOffsetDataTitle`}
        >
          {t('labware_offset_data')}
        </StyledText>
      </Flex>
      {uniqueLabwareOffsets.map((offset, index) => {
        let labwareName = offset.definitionUri
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
