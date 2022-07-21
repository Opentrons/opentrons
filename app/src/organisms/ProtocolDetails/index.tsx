import * as React from 'react'
import map from 'lodash/map'
import omit from 'lodash/omit'
import isEmpty from 'lodash/isEmpty'
import startCase from 'lodash/startCase'
import { format } from 'date-fns'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useFeatureFlag } from '../../redux/config'
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
  JUSTIFY_SPACE_BETWEEN,
  Text,
} from '@opentrons/components'
import {
  parseInitialPipetteNamesByMount,
  parseInitialLoadedModulesBySlot,
  parseInitialLoadedLabwareBySlot,
  parseInitialLoadedLabwareByModuleId,
} from '@opentrons/api-client'

import { getIsProtocolAnalysisInProgress } from '../../redux/protocol-storage'
import { ProtocolAnalysisFailure } from '../ProtocolAnalysisFailure'
import { DeckThumbnail } from '../../molecules/DeckThumbnail'
import { StyledText } from '../../atoms/text'
import { PrimaryButton } from '../../atoms/buttons'
import { Divider } from '../../atoms/structure'
import { ChooseRobotSlideout } from '../ChooseRobotSlideout'
import { OverflowMenu } from './OverflowMenu'
import { RobotConfigurationDetails } from './RobotConfigurationDetails'
import { ProtocolLabwareDetails } from './ProtocolLabwareDetails'
import { ProtocolLiquidsDetails } from './ProtocolLiquidsDetails'
import {
  getAnalysisStatus,
  getProtocolDisplayName,
} from '../ProtocolsLanding/utils'

import type { State } from '../../redux/types'
import type { StoredProtocolData } from '../../redux/protocol-storage'
import type { JsonConfig, PythonConfig } from '@opentrons/shared-data'

const defaultTabStyle = css`
  ${TYPOGRAPHY.pSemiBold}
  border-radius: ${BORDERS.radiusSoftCorners} ${BORDERS.radiusSoftCorners} 0 0;
  border-top: ${BORDERS.transparentLineBorder};
  border-left: ${BORDERS.transparentLineBorder};
  border-right: ${BORDERS.transparentLineBorder};
  padding: ${SPACING.spacing3} ${SPACING.spacing4};
  position: ${POSITION_RELATIVE};
`

const inactiveTabStyle = css`
  color: ${COLORS.darkGreyEnabled};

  &:hover {
    color: ${COLORS.darkGreyEnabled};
    background-color: ${COLORS.fundamentalsBackgroundShade};
    border-radius: 4px 4px 0px 0px;
  }
`

const currentTabStyle = css`
  ${TYPOGRAPHY.pSemiBold}
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

const GRID_STYLE = css`
  display: grid;
  width: 100%;
  grid-template-columns: 26.6% 26.6% 26.6% 20.2%;
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
          : css`
              ${defaultTabStyle}
              ${inactiveTabStyle}
            `
      }
    >
      {children}
    </Btn>
  )
}

interface ReadMoreContentProps {
  metadata: {
    [key: string]: any
  }
  protocolType: 'json' | 'python'
}

const ReadMoreContent = (props: ReadMoreContentProps): JSX.Element => {
  const { metadata, protocolType } = props
  const { t } = useTranslation('protocol_details')
  const [isReadMore, setIsReadMore] = React.useState(true)

  const description = isEmpty(metadata.description)
    ? t('shared:no_data')
    : metadata.description

  const getMetadataDetails = (
    description: string,
    protocolType: string
  ): string | JSX.Element => {
    if (protocolType === 'json') {
      return <StyledText as="p">{description}</StyledText>
    } else {
      const filteredMetaData = Object.entries(
        omit(metadata, ['description', 'protocolName', 'author', 'apiLevel'])
      ).map(item => ({ label: item[0], value: item[1] }))

      return (
        <Flex
          flex="1"
          flexDirection={DIRECTION_COLUMN}
          data-testid={`ProtocolDetails_description`}
        >
          <StyledText as="p">{description}</StyledText>
          {filteredMetaData.map((item, index) => {
            return (
              <React.Fragment key={index}>
                <StyledText as="h6" marginTop={SPACING.spacing3}>
                  {startCase(item.label)}
                </StyledText>
                <StyledText as="p">{item.value}</StyledText>
              </React.Fragment>
            )
          })}
        </Flex>
      )
    }
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {isReadMore ? (
        <StyledText as="p">{description.slice(0, 160)}</StyledText>
      ) : (
        getMetadataDetails(description, protocolType)
      )}
      {(description.length > 160 || protocolType === 'python') && (
        <Link
          role="button"
          css={TYPOGRAPHY.linkPSemiBold}
          marginTop={SPACING.spacing3}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          onClick={() => setIsReadMore(!isReadMore)}
        >
          {isReadMore ? t('read_more') : t('read_less')}
        </Link>
      )}
    </Flex>
  )
}

interface ProtocolDetailsProps extends StoredProtocolData {}

export function ProtocolDetails(
  props: ProtocolDetailsProps
): JSX.Element | null {
  const { protocolKey, srcFileNames, mostRecentAnalysis, modified } = props
  const { t } = useTranslation(['protocol_details', 'shared'])
  const [currentTab, setCurrentTab] = React.useState<
    'robot_config' | 'labware' | 'liquids'
  >('robot_config')
  const [showSlideout, setShowSlideout] = React.useState(false)
  const isAnalyzing = useSelector((state: State) =>
    getIsProtocolAnalysisInProgress(state, protocolKey)
  )
  const analysisStatus = getAnalysisStatus(isAnalyzing, mostRecentAnalysis)
  const liquidSetupEnabled = useFeatureFlag('enableLiquidSetup')
  if (analysisStatus === 'missing') return null

  const { left: leftMountPipetteName, right: rightMountPipetteName } =
    mostRecentAnalysis != null
      ? parseInitialPipetteNamesByMount(mostRecentAnalysis.commands)
      : { left: null, right: null }

  const requiredModuleDetails =
    mostRecentAnalysis != null
      ? map(
          parseInitialLoadedModulesBySlot(
            mostRecentAnalysis.commands != null
              ? mostRecentAnalysis.commands
              : []
          )
        )
      : []

  const requiredLabwareDetails =
    mostRecentAnalysis != null
      ? map({
          ...parseInitialLoadedLabwareByModuleId(
            mostRecentAnalysis.commands != null
              ? mostRecentAnalysis.commands
              : []
          ),
          ...parseInitialLoadedLabwareBySlot(
            mostRecentAnalysis.commands != null
              ? mostRecentAnalysis.commands
              : []
          ),
        }).filter(
          labware => labware.result.definition.parameters.format !== 'trash'
        )
      : []

  const protocolDisplayName = getProtocolDisplayName(
    protocolKey,
    srcFileNames,
    mostRecentAnalysis
  )

  const getCreationMethod = (config: JsonConfig | PythonConfig): string => {
    if (config.protocolType === 'json') {
      return t('protocol_designer_version', {
        version: config.schemaVersion.toFixed(1),
      })
    } else {
      return t('python_api_version', {
        version:
          config.apiVersion != null ? config.apiVersion?.join('.') : null,
      })
    }
  }

  const creationMethod =
    mostRecentAnalysis != null
      ? getCreationMethod(mostRecentAnalysis.config) ?? t('shared:no_data')
      : t('shared:no_data')
  const author =
    mostRecentAnalysis != null
      ? mostRecentAnalysis?.metadata?.author ?? t('shared:no_data')
      : t('shared:no_data')
  const lastAnalyzed =
    mostRecentAnalysis?.createdAt != null
      ? format(new Date(mostRecentAnalysis.createdAt), 'MMMM dd, yyyy HH:mm')
      : t('shared:no_data')

  const getTabContents = (): JSX.Element => {
    switch (currentTab) {
      case 'labware':
        return (
          <ProtocolLabwareDetails
            requiredLabwareDetails={requiredLabwareDetails}
          />
        )

      case 'robot_config':
        return (
          <RobotConfigurationDetails
            leftMountPipetteName={leftMountPipetteName}
            rightMountPipetteName={rightMountPipetteName}
            requiredModuleDetails={requiredModuleDetails}
            isLoading={analysisStatus === 'loading'}
          />
        )

      case 'liquids':
        return <ProtocolLiquidsDetails />
    }
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing4}
      width="100%"
    >
      <ChooseRobotSlideout
        onCloseClick={() => setShowSlideout(false)}
        showSlideout={showSlideout}
        storedProtocolData={props}
      />

      <Flex
        backgroundColor={COLORS.white}
        border={`1px solid ${COLORS.medGrey}`}
        borderRadius={BORDERS.radiusSoftCorners}
        position={POSITION_RELATIVE}
        flexDirection={DIRECTION_ROW}
        width="100%"
        marginBottom={SPACING.spacing4}
      >
        <Box
          padding={`${SPACING.spacing4} 0 ${SPACING.spacing4} ${SPACING.spacing4}`}
          width="100%"
        >
          {analysisStatus !== 'loading' &&
          mostRecentAnalysis != null &&
          mostRecentAnalysis.errors.length > 0 ? (
            <ProtocolAnalysisFailure
              protocolKey={protocolKey}
              errors={mostRecentAnalysis.errors.map(e => e.detail)}
            />
          ) : null}
          <StyledText
            css={TYPOGRAPHY.h2SemiBold}
            marginBottom={SPACING.spacing4}
            data-testid={`ProtocolDetails_${protocolDisplayName}`}
          >
            {protocolDisplayName}
          </StyledText>
          <Flex css={GRID_STYLE}>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              data-testid={`ProtocolDetails_creationMethod`}
            >
              <StyledText as="h6" color={COLORS.darkGreyEnabled}>
                {t('creation_method')}
              </StyledText>
              <StyledText as="p">
                {analysisStatus === 'loading'
                  ? t('shared:loading')
                  : creationMethod}
              </StyledText>
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              data-testid={`ProtocolDetails_lastUpdated`}
            >
              <StyledText as="h6" color={COLORS.darkGreyEnabled}>
                {t('last_updated')}
              </StyledText>
              <StyledText as="p">
                {analysisStatus === 'loading'
                  ? t('shared:loading')
                  : format(new Date(modified), 'MMMM dd, yyyy HH:mm')}
              </StyledText>
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              data-testid={`ProtocolDetails_lastAnalyzed`}
            >
              <StyledText as="h6" color={COLORS.darkGreyEnabled}>
                {t('last_analyzed')}
              </StyledText>
              <StyledText as="p">
                {analysisStatus === 'loading'
                  ? t('shared:loading')
                  : lastAnalyzed}
              </StyledText>
            </Flex>
            <Flex
              css={css`
                display: grid;
                justify-self: end;
              `}
            >
              <PrimaryButton
                onClick={() => setShowSlideout(true)}
                data-testid={`ProtocolDetails_runProtocol`}
                disabled={analysisStatus === 'loading'}
              >
                {t('run_protocol')}
              </PrimaryButton>
            </Flex>
          </Flex>
          <Divider marginY={SPACING.spacing4} />
          <Flex css={GRID_STYLE}>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              data-testid={`ProtocolDetails_author`}
            >
              <StyledText as="h6" color={COLORS.darkGreyEnabled}>
                {t('org_or_author')}
              </StyledText>
              <StyledText
                as="p"
                marginRight={SPACING.spacingM}
                overflowWrap="anywhere"
              >
                {analysisStatus === 'loading' ? t('shared:loading') : author}
              </StyledText>
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              data-testid={`ProtocolDetails_description`}
            >
              <StyledText as="h6" color={COLORS.darkGreyEnabled}>
                {t('description')}
              </StyledText>
              {analysisStatus === 'loading' ? (
                <StyledText as="p">{t('shared:loading')}</StyledText>
              ) : null}
              {mostRecentAnalysis != null ? (
                <ReadMoreContent
                  metadata={mostRecentAnalysis.metadata}
                  protocolType={mostRecentAnalysis.config.protocolType}
                />
              ) : null}
            </Flex>
          </Flex>
        </Box>
        <Box
          position={POSITION_RELATIVE}
          top={SPACING.spacing1}
          right={SPACING.spacing1}
        >
          <OverflowMenu
            protocolKey={protocolKey}
            protocolType={mostRecentAnalysis?.config?.protocolType ?? 'python'}
            data-testid={`ProtocolDetails_overFlowMenu`}
          />
        </Box>
      </Flex>

      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Box
          flex="0 0 20rem"
          backgroundColor={COLORS.white}
          data-testid={`ProtocolDetails_deckMap`}
          border={`1px solid ${COLORS.medGrey}`}
          borderRadius={BORDERS.radiusSoftCorners}
        >
          <StyledText
            as="h3"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            margin={SPACING.spacing4}
          >
            {t('deck_setup')}
          </StyledText>
          <Divider />
          <Box padding={SPACING.spacing4} backgroundColor={COLORS.white}>
            {
              {
                missing: <Box size="15rem" backgroundColor={COLORS.medGrey} />,
                loading: <Box size="15rem" backgroundColor={COLORS.medGrey} />,
                error: <Box size="15rem" backgroundColor={COLORS.medGrey} />,
                complete: (
                  <DeckThumbnail
                    commands={mostRecentAnalysis?.commands ?? []}
                    showLiquids
                  />
                ),
              }[analysisStatus]
            }
          </Box>
        </Box>

        <Flex
          width="100%"
          height="100%"
          flexDirection={DIRECTION_COLUMN}
          marginLeft={SPACING.spacing4}
        >
          <Flex>
            <RoundTab
              data-testid={`ProtocolDetails_robotConfig`}
              isCurrent={currentTab === 'robot_config'}
              onClick={() => setCurrentTab('robot_config')}
            >
              <Text textTransform={TYPOGRAPHY.textTransformCapitalize}>
                {t('robot_configuration')}
              </Text>
            </RoundTab>
            <RoundTab
              data-testid={`ProtocolDetails_labware`}
              isCurrent={currentTab === 'labware'}
              onClick={() => setCurrentTab('labware')}
            >
              <Text textTransform={TYPOGRAPHY.textTransformCapitalize}>
                {t('labware')}
              </Text>
            </RoundTab>
            {liquidSetupEnabled && (
              <RoundTab
                data-testid={`ProtocolDetails_liquids`}
                isCurrent={currentTab === 'liquids'}
                onClick={() => setCurrentTab('liquids')}
              >
                <Text textTransform={TYPOGRAPHY.textTransformCapitalize}>
                  {t('liquids')}
                </Text>
              </RoundTab>
            )}
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
            padding={
              currentTab === 'robot_config'
                ? `${SPACING.spacing5} ${SPACING.spacing4}`
                : `${SPACING.spacing4} ${SPACING.spacing4} 0 ${SPACING.spacing4}`
            }
          >
            {getTabContents()}
          </Box>
        </Flex>
      </Flex>
    </Flex>
  )
}
