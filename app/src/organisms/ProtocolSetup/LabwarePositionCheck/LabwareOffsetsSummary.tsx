import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import * as Config from '../../../redux/config'
import {
  ALIGN_CENTER,
  C_DARK_GRAY,
  C_MED_GRAY,
  C_NEAR_WHITE,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  FONT_BODY_1_DARK,
  FONT_SIZE_BODY_2,
  FONT_SIZE_CAPTION,
  FONT_WEIGHT_SEMIBOLD,
  Icon,
  JUSTIFY_CENTER,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  SPACING_4,
  SPACING_5,
  TEXT_TRANSFORM_UPPERCASE,
  Text,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import type { LabwareOffsets } from './hooks/useLabwareOffsets'

interface LabwareOffsetSummary {
  offsetData: LabwareOffsets
}

const OffsetDataLoader = (): JSX.Element | null => {
  const { t } = useTranslation('protocol_setup')
  return (
    <Flex
      justifyContent={JUSTIFY_CENTER}
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
    >
      <Text
        as={'h3'}
        color={C_DARK_GRAY}
        marginTop={SPACING_4}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        fontSize={FONT_SIZE_BODY_2}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
      >
        {t('loading_labware_offsets')}
      </Text>
      <Icon
        name="ot-spinner"
        id={`LabwareOffsetsSummary_loadingSpinner`}
        width={SPACING_5}
        marginTop={SPACING_4}
        marginBottom={SPACING_4}
        color={C_MED_GRAY}
        spin
      />
    </Flex>
  )
}

const SummaryData = (props: LabwareOffsetSummary): JSX.Element => {
  const { offsetData } = props
  const { t } = useTranslation('labware_position_check')
  return (
    <Flex flexDirection={DIRECTION_ROW}>
      <Flex
        flex={'auto'}
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
      >
        <Text
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          marginBottom={SPACING_3}
          color={C_MED_GRAY}
          fontSize={FONT_SIZE_CAPTION}
        >
          {t('labware_offsets_summary_location')}
        </Text>
        {offsetData.map(({ displayLocation: location }) => {
          return (
            <Flex
              key={location}
              marginBottom={SPACING_3}
              css={FONT_BODY_1_DARK}
            >
              {location}
            </Flex>
          )
        })}
      </Flex>
      <Flex
        flex={'auto'}
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
      >
        <Text
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          marginBottom={SPACING_3}
          color={C_MED_GRAY}
          fontSize={FONT_SIZE_CAPTION}
        >
          {t('labware_offsets_summary_labware')}
        </Text>
        {offsetData.map(({ displayName: labware }, index) => {
          return (
            <Flex
              key={`${labware}_${index}`}
              marginBottom={SPACING_3}
              css={FONT_BODY_1_DARK}
            >
              {labware}
            </Flex>
          )
        })}
      </Flex>
      <Flex
        flex={'auto'}
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
      >
        <Text
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          marginBottom={SPACING_3}
          color={C_MED_GRAY}
          fontSize={FONT_SIZE_CAPTION}
        >
          {t('labware_offsets_summary_offset')}
        </Text>
        {offsetData
          .map(({ vector }) => vector)
          .map(({ x, y, z }, index) => {
            return x === 0 && y === 0 && z === 0 ? (
              <Flex key={index} marginBottom={SPACING_3} css={FONT_BODY_1_DARK}>
                {t('no_labware_offsets')}
              </Flex>
            ) : (
              <Flex key={index} marginBottom={SPACING_3} css={FONT_BODY_1_DARK}>
                <Text as={'strong'} marginRight={SPACING_1}>
                  X
                </Text>
                <Text as={'span'} marginRight={SPACING_2}>
                  {x.toFixed(2)}
                </Text>
                <Text as={'strong'} marginRight={SPACING_1}>
                  Y
                </Text>
                <Text as={'span'} marginRight={SPACING_2}>
                  {y.toFixed(2)}
                </Text>
                <Text as={'strong'} marginRight={SPACING_1}>
                  Z
                </Text>
                <Text as={'span'} marginRight={SPACING_2}>
                  {z.toFixed(2)}
                </Text>
              </Flex>
            )
          })}
      </Flex>
    </Flex>
  )
}

export const LabwareOffsetsSummary = (
  props: LabwareOffsetSummary
): JSX.Element | null => {
  const { offsetData } = props
  const { t } = useTranslation('labware_position_check')
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    Config.getIsLabwareOffsetCodeSnippetsOn
  )
  return (
    <React.Fragment>
      <Flex
        flex={'auto'}
        padding={SPACING_4}
        boxShadow="1px 1px 1px rgba(0, 0, 0, 0.25)"
        borderRadius="4px"
        backgroundColor={C_NEAR_WHITE}
        flexDirection={DIRECTION_COLUMN}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Text
            as={'h5'}
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            marginBottom={SPACING_3}
          >
            {t('labware_offsets_summary_title')}
          </Text>
        </Flex>
        {offsetData.length === 0 ? (
          <OffsetDataLoader />
        ) : (
          <SummaryData offsetData={offsetData} />
        )}
      </Flex>
    </React.Fragment>
  )
}
