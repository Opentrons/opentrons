import * as React from 'react'
import { useParams, useHistory, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  COLORS,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  POSITION_RELATIVE,
  OVERFLOW_HIDDEN,
  ALIGN_FLEX_END,
  POSITION_ABSOLUTE,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_STRETCH,
  ALIGN_FLEX_START,
} from '@opentrons/components'
import { useProtocolQuery, useRunQuery } from '@opentrons/react-api-client'

import { TertiaryButton } from '../../atoms/buttons'
import type { OnDeviceRouteParams } from '../../App/types'
import { LargeButton } from '../../atoms/buttons/OnDeviceDisplay'

export function RunSummary(): JSX.Element {
  const { runId } = useParams<OnDeviceRouteParams>()
  const { t } = useTranslation('run_details')
  const history = useHistory()
  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data.protocolId ?? null
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })
  const protocolName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name

  const [showSplash, setShowSplash] = React.useState(true)

  const handleReturnToDash = () => {
    console.log('return to dash')
  }

  const handleRunAgain = () => {
    history.push(`/protocols/${runId}/setup`)
  }
  return (
    <>
      <Flex
        height="100vh"
        flexDirection={DIRECTION_COLUMN}
        position={POSITION_RELATIVE}
        overflow={OVERFLOW_HIDDEN}
        onClick={() => {
          setShowSplash(false)
        }}
      >
        {showSplash ? (
          <Flex
            height="100vh"
            width="100%"
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
            position={POSITION_ABSOLUTE}
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacingXXL}
            padding={SPACING.spacingXXL}
            backgroundColor={COLORS.green_two}
          >
            <Flex gridGap={SPACING.spacing6} alignItems={ALIGN_CENTER}>
              <Icon name="ot-check" size="4.5rem" color={COLORS.white} />
              <SplashHeader> {t('run_complete')} </SplashHeader>
            </Flex>
            <SplashBody>{protocolName}</SplashBody>
          </Flex>
        ) : (
          <Flex
            height="100vh"
            width="100%"
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            padding={SPACING.spacingXXL}
          >
            <Flex
              flexDirection={DIRECTION_COLUMN}
              alignItems={ALIGN_FLEX_START}
              gridGap={SPACING.spacing4}
            >
              <Flex gridGap={SPACING.spacing3} alignItems={ALIGN_CENTER}>
                <Icon
                  name="ot-check"
                  size="2rem"
                  color={COLORS.successEnabled}
                />
                <SummaryHeader>{t('run_complete')}</SummaryHeader>
              </Flex>
              <ProtocolName>{protocolName}</ProtocolName>
              <Flex gridGap={SPACING.spacing3}>
                <SummaryDatum> Run: 12/2/22 15:32 </SummaryDatum>
                <SummaryDatum> Duration: 00:41:42 </SummaryDatum>
                <SummaryDatum> Start: 14:99:09 </SummaryDatum>
                <SummaryDatum> End: +1 06:10:12 </SummaryDatum>
              </Flex>
            </Flex>
            <Flex alignSelf={ALIGN_STRETCH} gridGap={SPACING.spacing4}>
              <LargeButton
                flex="1"
                iconName="arrow-left"
                buttonType="secondary"
                onClick={handleReturnToDash}
                buttonText={t('return_to_dashboard')}
              />
              <LargeButton
                flex="1"
                iconName="play"
                buttonType="primary"
                onClick={handleRunAgain}
                buttonText={t('run_again')}
              />
            </Flex>
          </Flex>
        )}
      </Flex>
      {/* temporary */}
      <Flex
        alignSelf={ALIGN_FLEX_END}
        marginTop={SPACING.spacing5}
        width="fit-content"
        paddingRight={SPACING.spacing6}
      >
        <Link to="/dashboard">
          <TertiaryButton>back to RobotDashboard</TertiaryButton>
        </Link>
      </Flex>
    </>
  )
}

const SplashHeader = styled.h1`
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-size: 80px;
  line-height: 94px;
  color: ${COLORS.white};
`
const SplashBody = styled.h4`
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
  color: ${COLORS.white};
`

const SummaryHeader = styled.h4`
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
`

const ProtocolName = styled.h4`
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
  color: ${COLORS.darkBlack_seventy};
`

const SummaryDatum = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  grid-gap: 4px;
  height: 44px;
  background: #d6d6d6;
  border-radius: 4px;
  color: ${COLORS.darkBlack_ninety};
`
