import * as React from 'react'
import path from 'path'
import first from 'lodash/first'
import { Trans, useTranslation } from 'react-i18next'
import { Link, NavLink, useHistory } from 'react-router-dom'
import { ApiHostProvider } from '@opentrons/react-api-client'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  SPACING,
  SIZE_1,
  TYPOGRAPHY,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  Box,
  Flex,
  BORDERS,
  DIRECTION_COLUMN,
  DISPLAY_BLOCK,
  Icon,
  PrimaryButton,
  COLORS,
} from '@opentrons/components'

import { useLogger } from '../../logger'
import { OPENTRONS_USB } from '../../redux/discovery'
import { getStoredProtocols } from '../../redux/protocol-storage'
import { appShellRequestor } from '../../redux/shell/remote'
import { Slideout } from '../../atoms/Slideout'
import { StyledText } from '../../atoms/text'
import { MiniCard } from '../../molecules/MiniCard'
import { DeckThumbnail } from '../../molecules/DeckThumbnail'
import { useTrackCreateProtocolRunEvent } from '../Devices/hooks'
import { useCreateRunFromProtocol } from '../ChooseRobotToRunProtocolSlideout/useCreateRunFromProtocol'
import { ApplyHistoricOffsets } from '../ApplyHistoricOffsets'
import { useOffsetCandidatesForAnalysis } from '../ApplyHistoricOffsets/hooks/useOffsetCandidatesForAnalysis'

import type { Robot } from '../../redux/discovery/types'
import type { StoredProtocolData } from '../../redux/protocol-storage'
import type { State } from '../../redux/types'

interface ChooseProtocolSlideoutProps {
  robot: Robot
  onCloseClick: () => void
  showSlideout: boolean
}
export function ChooseProtocolSlideoutComponent(
  props: ChooseProtocolSlideoutProps
): JSX.Element | null {
  const { t } = useTranslation(['device_details', 'shared'])
  const history = useHistory()
  const logger = useLogger(__filename)
  const { robot, showSlideout, onCloseClick } = props
  const { name } = robot

  const [
    selectedProtocol,
    setSelectedProtocol,
  ] = React.useState<StoredProtocolData | null>(null)
  const [shouldApplyOffsets, setShouldApplyOffsets] = React.useState(true)
  const offsetCandidates = useOffsetCandidatesForAnalysis(
    selectedProtocol?.mostRecentAnalysis ?? null,
    robot.ip
  )

  const srcFileObjects =
    selectedProtocol != null
      ? selectedProtocol.srcFiles.map((srcFileBuffer, index) => {
          const srcFilePath = selectedProtocol.srcFileNames[index]
          return new File([srcFileBuffer], path.basename(srcFilePath))
        })
      : []

  const { trackCreateProtocolRunEvent } = useTrackCreateProtocolRunEvent(
    selectedProtocol
  )

  const {
    createRunFromProtocolSource,
    runCreationError,
    isCreatingRun,
    reset: resetCreateRun,
    runCreationErrorCode,
  } = useCreateRunFromProtocol(
    {
      onSuccess: ({ data: runData }) => {
        trackCreateProtocolRunEvent({
          name: 'createProtocolRecordResponse',
          properties: { success: true },
        })
        history.push(`/devices/${name}/protocol-runs/${runData.id}`)
      },
      onError: (error: Error) => {
        trackCreateProtocolRunEvent({
          name: 'createProtocolRecordResponse',
          properties: { success: false, error: error.message },
        })
      },
    },
    { hostname: robot.ip },
    shouldApplyOffsets
      ? offsetCandidates.map(({ vector, location, definitionUri }) => ({
          vector,
          location,
          definitionUri,
        }))
      : []
  )
  const handleProceed: React.MouseEventHandler<HTMLButtonElement> = () => {
    if (selectedProtocol != null) {
      trackCreateProtocolRunEvent({ name: 'createProtocolRecordRequest' })
      createRunFromProtocolSource({
        files: srcFileObjects,
        protocolKey: selectedProtocol.protocolKey,
      })
    } else {
      logger.warn('failed to create protocol, no protocol selected')
    }
  }
  return (
    <Slideout
      isExpanded={showSlideout}
      onCloseClick={onCloseClick}
      title={t('choose_protocol_to_run', { name })}
      footer={
        <ApiHostProvider
          hostname={robot.ip}
          requestor={
            robot?.ip === OPENTRONS_USB ? appShellRequestor : undefined
          }
        >
          <ApplyHistoricOffsets
            offsetCandidates={offsetCandidates}
            shouldApplyOffsets={shouldApplyOffsets}
            setShouldApplyOffsets={setShouldApplyOffsets}
            commands={selectedProtocol?.mostRecentAnalysis?.commands ?? []}
            labware={selectedProtocol?.mostRecentAnalysis?.labware ?? []}
            modules={selectedProtocol?.mostRecentAnalysis?.modules ?? []}
          />
          <PrimaryButton
            onClick={handleProceed}
            disabled={isCreatingRun || selectedProtocol == null}
            width="100%"
          >
            {isCreatingRun ? (
              <Icon name="ot-spinner" spin size={SIZE_1} />
            ) : (
              t('shared:proceed_to_setup')
            )}
          </PrimaryButton>
        </ApiHostProvider>
      }
    >
      {showSlideout ? (
        <StoredProtocolList
          handleSelectProtocol={storedProtocol => {
            if (!isCreatingRun) {
              resetCreateRun()
              setSelectedProtocol(storedProtocol)
            }
          }}
          robotName={robot.name}
          {...{ selectedProtocol, runCreationError, runCreationErrorCode }}
        />
      ) : null}
    </Slideout>
  )
}

export function ChooseProtocolSlideout(
  props: ChooseProtocolSlideoutProps
): JSX.Element | null {
  return <ChooseProtocolSlideoutComponent {...props} />
}

interface StoredProtocolListProps {
  selectedProtocol: StoredProtocolData | null
  handleSelectProtocol: (storedProtocol: StoredProtocolData | null) => void
  runCreationError: string | null
  runCreationErrorCode: number | null
  robotName: string
}

function StoredProtocolList(props: StoredProtocolListProps): JSX.Element {
  const {
    selectedProtocol,
    handleSelectProtocol,
    runCreationError,
    runCreationErrorCode,
    robotName,
  } = props
  const { t } = useTranslation(['device_details', 'shared'])
  const storedProtocols = useSelector((state: State) =>
    getStoredProtocols(state)
  )
  React.useEffect(() => {
    handleSelectProtocol(first(storedProtocols) ?? null)
  }, [])

  return storedProtocols.length > 0 ? (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      {storedProtocols.map(storedProtocol => {
        const isSelected =
          selectedProtocol != null &&
          storedProtocol.protocolKey === selectedProtocol.protocolKey
        return (
          <Flex
            flexDirection={DIRECTION_COLUMN}
            key={storedProtocol.protocolKey}
          >
            <MiniCard
              isSelected={isSelected}
              isError={runCreationError != null}
              onClick={() => handleSelectProtocol(storedProtocol)}
            >
              <Box display="grid" gridTemplateColumns="1fr 3fr">
                <Box
                  marginY={SPACING.spacingAuto}
                  backgroundColor={isSelected ? COLORS.white : 'inherit'}
                  marginRight={SPACING.spacing16}
                  height="4.25rem"
                  width="4.75rem"
                >
                  <DeckThumbnail
                    commands={storedProtocol.mostRecentAnalysis?.commands ?? []}
                    labware={storedProtocol.mostRecentAnalysis?.labware ?? []}
                  />
                </Box>
                <StyledText
                  as="p"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  overflowWrap="anywhere"
                >
                  {storedProtocol.mostRecentAnalysis?.metadata?.protocolName ??
                    first(storedProtocol.srcFileNames) ??
                    storedProtocol.protocolKey}
                </StyledText>
              </Box>
              {runCreationError != null && isSelected ? (
                <>
                  <Box flex="1 1 auto" />
                  <Icon
                    name="alert-circle"
                    size="1.25rem"
                    color={COLORS.errorEnabled}
                  />
                </>
              ) : null}
            </MiniCard>
            {runCreationError != null && isSelected ? (
              <StyledText
                as="label"
                color={COLORS.errorText}
                overflowWrap="anywhere"
                display={DISPLAY_BLOCK}
                marginTop={`-${SPACING.spacing4}`}
                marginBottom={SPACING.spacing8}
              >
                {runCreationErrorCode === 409 ? (
                  <Trans
                    t={t}
                    i18nKey="shared:robot_is_busy_no_protocol_run_allowed"
                    components={{
                      robotLink: (
                        <NavLink
                          css={css`
                            color: ${COLORS.errorText};
                            text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
                          `}
                          to={`/devices/${robotName}`}
                        />
                      ),
                    }}
                  />
                ) : (
                  runCreationError
                )}
              </StyledText>
            ) : null}
          </Flex>
        )
      })}
    </Flex>
  ) : (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      minHeight="11rem"
      padding={SPACING.spacing16}
      css={BORDERS.cardOutlineBorder}
    >
      <Icon size="1.25rem" name="alert-circle" color={COLORS.medGreyEnabled} />
      <StyledText
        as="p"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        marginTop={SPACING.spacing8}
        role="heading"
      >
        {t('no_protocols_found')}
      </StyledText>
      <StyledText
        as="p"
        marginTop={SPACING.spacing8}
        textAlign={TYPOGRAPHY.textAlignCenter}
      >
        <Trans
          t={t}
          i18nKey="to_run_protocol_go_to_protocols_page"
          components={{
            navlink: <Link to="/protocols" css={TYPOGRAPHY.linkPSemiBold} />,
          }}
        />
      </StyledText>
    </Flex>
  )
}
