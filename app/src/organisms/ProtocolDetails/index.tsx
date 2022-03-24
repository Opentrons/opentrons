import * as React from 'react'
import first from 'lodash/first'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import {
  getModuleType,
  getPipetteNameSpecs,
  schemaV6Adapter,
} from '@opentrons/shared-data'
import {
  Box,
  Flex,
  DIRECTION_ROW,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  Link,
  Card,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import {
  parseInitialPipetteNamesByMount,
  parseAllRequiredModuleModels,
} from '@opentrons/api-client'

import { StoredProtocolData } from '../../redux/protocol-storage'
import { StyledText } from '../../atoms/text'
import { PrimaryButton } from '../../atoms/Buttons'
import { ModuleIcon } from '../../molecules/ModuleIcon'
import { DeckThumbnail } from '../../molecules/DeckThumbnail'
import type { ProtocolAnalysisFile } from '@opentrons/shared-data'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { Divider } from '../../atoms/structure'

interface ProtocolDetailsProps extends StoredProtocolData {}

export function ProtocolDetails(
  props: ProtocolDetailsProps
): JSX.Element | null {
  const { protocolKey, srcFileNames, mostRecentAnalysis, modified } = props
  const { t } = useTranslation('protocol_details')
  const [
    protocolData,
    setProtocolData,
  ] = React.useState<ProtocolAnalysisFile<{}> | null>(null)

  React.useEffect(() => {
    if (mostRecentAnalysis != null) {
      setProtocolData(
        schemaV6Adapter(JSON.parse(mostRecentAnalysis)?.analyses[0])
      )
    }
  }, [modified])

  if (protocolData == null) return null
  // TODO: IMMEDIATELY clean up and move these protocol data selectors into api_client as
  // pure functions of RunTimeCommand[]
  const robotModel = protocolData?.robot?.model ?? 'OT-2'
  const { left: leftMountPipetteName, right: rightMountPipetteName } =
    protocolData != null ? parseInitialPipetteNamesByMount(protocolData) : {}
  const requiredModuleTypes =
    protocolData != null
      ? parseAllRequiredModuleModels(protocolData).map(getModuleType)
      : []

  const protocolName =
    protocolData?.metadata?.protocolName ?? first(srcFileNames) ?? protocolKey

  const creationMethod = ''
  const lastAnalyzed = ''
  const author = ''
  const description = ''

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing4}
      width="100%"
    >
      <Card marginBottom={SPACING.spacing4} padding={SPACING.spacing4}>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <StyledText as="h3" marginBottom={SPACING.spacing4} height="2.75rem">
            {protocolName}
          </StyledText>
          <OverflowBtn
            onClick={() => console.log('TODO: open overflow menu')}
          />
        </Flex>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Flex flexDirection={DIRECTION_COLUMN} marginRight={SPACING.spacing4}>
            <StyledText as="h6">{t('creation_method')}</StyledText>
            <StyledText as="p">{creationMethod}</StyledText>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} marginRight={SPACING.spacing4}>
            <StyledText as="h6">{t('last_updated')}</StyledText>
            <StyledText as="p">
              {format(new Date(modified), 'MMMM dd, yyyy HH:mm')}
            </StyledText>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} marginRight={SPACING.spacing4}>
            <StyledText as="h6">{t('last_analyzed')}</StyledText>
            <StyledText as="p">{lastAnalyzed}</StyledText>
          </Flex>
          <PrimaryButton
            onClick={() => console.log('TODO: open run on a robot slideout')}
          >
            {t('run_protocol')}
          </PrimaryButton>
        </Flex>
        <Divider marginY={SPACING.spacing4} />
        <Flex flexDirection={DIRECTION_ROW}>
          <Flex
            flex="1"
            flexDirection={DIRECTION_COLUMN}
            marginRight={SPACING.spacing4}
          >
            <StyledText as="h6">{t('org_or_author')}</StyledText>
            <StyledText as="p">{author}</StyledText>
          </Flex>
          <Flex
            flex="1"
            flexDirection={DIRECTION_COLUMN}
            marginRight={SPACING.spacing4}
          >
            <StyledText as="h6">{t('description')}</StyledText>
            <StyledText as="p">{description}</StyledText>
            <Link
              onClick={() =>
                console.log(
                  'TODO: truncate description if more than three lines'
                )
              }
            >
              {t('read_more')}
            </Link>
          </Flex>
        </Flex>
      </Card>

      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Card flex="1">
          <StyledText
            as="h3"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            margin={SPACING.spacing4}
          >
            {t('deck_setup')}
          </StyledText>
          <Divider />
          <Box padding={SPACING.spacing4}>
            <DeckThumbnail analysis={protocolData} />
          </Box>
        </Card>
        <Box height="100%" width={SPACING.spacing4} />
        <Card flex="1">
          {t('labware')}
          {t('liquids')}
          {t('robot_configuration')}

          <Flex flexDirection={DIRECTION_COLUMN}>
            <Flex flexDirection={DIRECTION_ROW} marginRight={SPACING.spacing4}>
              <StyledText as="h6">{t('robot')}</StyledText>
              <StyledText as="p">{robotModel}</StyledText>
            </Flex>
            <Flex flexDirection={DIRECTION_ROW} marginRight={SPACING.spacing4}>
              <StyledText as="h6">{t('left_mount')}</StyledText>
              <StyledText as="p">
                {leftMountPipetteName != null
                  ? getPipetteNameSpecs(leftMountPipetteName)?.displayName
                  : t('empty')}
              </StyledText>
            </Flex>
            <Flex flexDirection={DIRECTION_ROW} marginRight={SPACING.spacing4}>
              <StyledText as="h6">{t('right_mount')}</StyledText>
              <StyledText as="p">
                {rightMountPipetteName != null
                  ? getPipetteNameSpecs(rightMountPipetteName)?.displayName
                  : t('empty')}
              </StyledText>
            </Flex>
            {requiredModuleTypes.length > 0 ? (
              <Flex
                flexDirection={DIRECTION_COLUMN}
                marginRight={SPACING.spacing4}
              >
                <StyledText as="h6">{t('modules')}</StyledText>
                <Flex>
                  {requiredModuleTypes.map((moduleType, index) => (
                    <ModuleIcon
                      key={index}
                      moduleType={moduleType}
                      height="1rem"
                      marginRight={SPACING.spacing3}
                    />
                  ))}
                </Flex>
              </Flex>
            ) : null}
          </Flex>
        </Card>
      </Flex>
    </Flex>
  )
}
