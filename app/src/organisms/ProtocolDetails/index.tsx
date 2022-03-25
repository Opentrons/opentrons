import * as React from 'react'
import first from 'lodash/first'
import { format } from 'date-fns'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  getModuleType,
  getPipetteNameSpecs,
  schemaV6Adapter,
} from '@opentrons/shared-data'
import {
  Box,
  Btn,
  Flex,
  DIRECTION_ROW,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  BORDERS,
  SIZE_1,
  DIRECTION_COLUMN,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  DISPLAY_BLOCK,
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
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { Divider } from '../../atoms/structure'
import { ChooseRobotSlideout } from './ChooseRobotSlideout'

const defaultTabStyle = css`
  ${TYPOGRAPHY.pSemiBold}
  border-radius: ${BORDERS.radiusSoftCorners} ${BORDERS.radiusSoftCorners} 0 0;
  border-top: ${BORDERS.transparentLineBorder};
  border-left: ${BORDERS.transparentLineBorder};
  border-right: ${BORDERS.transparentLineBorder};
  color: ${COLORS.darkGreyEnabled};
  padding: ${SPACING.spacing3} ${SPACING.spacing4};
  position: ${POSITION_RELATIVE};
`

const currentTabStyle = css`
  background-color: ${COLORS.white};
  border-top: ${BORDERS.lineBorder};
  border-left: ${BORDERS.lineBorder};
  border-right: ${BORDERS.lineBorder};
  color: ${COLORS.blue};

  /* extend below the tab when active to flow into the content */
  &:after {
    position: ${POSITION_ABSOLUTE};
    display: ${DISPLAY_BLOCK};
    content: '';
    background-color: ${COLORS.white};
    top: 100;
    left: 0;
    height: ${SIZE_1};
    width: 100%;
  }
`
interface RoundTabProps extends React.ComponentProps<typeof Btn> {
  isCurrent: boolean
}
function RoundTab({
  isCurrent,
  children,
  ...restProps
}: RoundTabProps): JSX.Element {
  return (
    <Btn
      {...restProps}
      css={
        isCurrent
          ? css`
              ${defaultTabStyle}
              ${currentTabStyle}
            `
          : defaultTabStyle
      }
    >
      {children}
    </Btn>
  )
}

interface ProtocolDetailsProps extends StoredProtocolData {}

export function ProtocolDetails(
  props: ProtocolDetailsProps
): JSX.Element | null {
  const { protocolKey, srcFileNames, mostRecentAnalysis, modified } = props
  const { t } = useTranslation('protocol_details')
  const [currentTab, setCurrentTab] = React.useState<
    'robot_config' | 'labware'
  >('robot_config')
  const [showSlideout, setShowSlideout] = React.useState(false)

  if (mostRecentAnalysis == null) return null
  // TODO: IMMEDIATELY clean up and move these protocol data selectors into api_client as
  // pure functions of RunTimeCommand[]

  const robotModel = mostRecentAnalysis?.robot?.model ?? 'OT-2'
  const { left: leftMountPipetteName, right: rightMountPipetteName } =
    mostRecentAnalysis != null
      ? parseInitialPipetteNamesByMount(mostRecentAnalysis)
      : {}
  const requiredModuleTypes =
    mostRecentAnalysis != null
      ? parseAllRequiredModuleModels(mostRecentAnalysis).map(getModuleType)
      : []

  const protocolName =
    mostRecentAnalysis?.metadata?.protocolName ??
    first(srcFileNames) ??
    protocolKey

  const creationMethod = ''
  const lastAnalyzed = ''
  const author = ''
  const description = ''

  const getTabContents = (): JSX.Element =>
    currentTab === 'labware' ? (
      <Box>TODO: labware tab contents</Box>
    ) : (
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
          <Flex flexDirection={DIRECTION_COLUMN} marginRight={SPACING.spacing4}>
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
    )

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing4}
      width="100%"
    >
      <ChooseRobotSlideout
        onCloseClick={() => setShowSlideout(false)}
        showSlideout={showSlideout}
        protocolKey={protocolKey}
      />
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
            onClick={() => setShowSlideout(true)}
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
            <DeckThumbnail analysis={mostRecentAnalysis} />
          </Box>
        </Card>
        <Box height="100%" width={SPACING.spacing4} />
        <Card flex="1">
          <Flex>
            <RoundTab
              isCurrent={currentTab === 'robot_config'}
              onClick={() => setCurrentTab('robot_config')}
            >
              {t('robot_configuration')}
            </RoundTab>
            <RoundTab
              isCurrent={currentTab === 'labware'}
              onClick={() => setCurrentTab('labware')}
            >
              {t('labware')}
            </RoundTab>
          </Flex>
          <Box
            backgroundColor={COLORS.white}
            border={`${SPACING.spacingXXS} ${BORDERS.styleSolid} ${COLORS.medGrey}`}
            // remove left upper corner border radius when first tab is active
            borderRadius={`${
              currentTab === 'robot_config' ? '0' : BORDERS.radiusSoftCorners
            } ${BORDERS.radiusSoftCorners} ${BORDERS.radiusSoftCorners} ${
              BORDERS.radiusSoftCorners
            }`}
            padding={`${SPACING.spacing5} ${SPACING.spacing4}`}
          >
            {getTabContents()}
          </Box>
        </Card>
      </Flex>
    </Flex>
  )
}
