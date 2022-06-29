import * as React from 'react'
import path from 'path'
import first from 'lodash/first'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { ApiHostProvider } from '@opentrons/react-api-client'
import { useSelector } from 'react-redux'

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
  COLORS,
  TEXT_ALIGN_CENTER,
  ALIGN_FLEX_END,
} from '@opentrons/components'

import { getStoredProtocols } from '../../redux/protocol-storage'
import { Slideout } from '../../atoms/Slideout'
import { PrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { MiniCard } from '../../molecules/MiniCard'
import { DeckThumbnail } from '../../molecules/DeckThumbnail'
import { useCreateRunFromProtocol } from '../ChooseRobotSlideout/useCreateRunFromProtocol'

import type { Robot } from '../../redux/discovery/types'
import type { StoredProtocolData } from '../../redux/protocol-storage'
import type { State } from '../../redux/types'

interface ChooseProtocolSlideoutProps {
  robot: Robot
  onCloseClick: () => void
  showSlideout: boolean
}
export function ChooseProtocolSlideout(
  props: ChooseProtocolSlideoutProps
): JSX.Element | null {
  const { t } = useTranslation(['device_details', 'shared'])
  const { robot, showSlideout, onCloseClick } = props
  const { name } = robot
  const storedProtocols = useSelector((state: State) =>
    getStoredProtocols(state)
  )
  const [
    selectedProtocol,
    setSelectedProtocol,
  ] = React.useState<StoredProtocolData | null>(first(storedProtocols) ?? null)
  const [createRunError, setCreateRunError] = React.useState<string | null>(
    null
  )
  const [isCreatingRun, setIsCreatingRun] = React.useState<boolean>(false)

  const srcFileObjects =
    selectedProtocol != null
      ? selectedProtocol.srcFiles.map((srcFileBuffer, index) => {
          const srcFilePath = selectedProtocol.srcFileNames[index]
          return new File([srcFileBuffer], path.basename(srcFilePath))
        })
      : []
  return (
    <Slideout
      isExpanded={showSlideout}
      onCloseClick={onCloseClick}
      title={t('choose_protocol_to_run', { name })}
      footer={
        <ApiHostProvider hostname={robot.ip}>
          <CreateRunButton
            disabled={selectedProtocol == null}
            protocolKey={
              selectedProtocol != null ? selectedProtocol.protocolKey : ''
            }
            srcFileObjects={srcFileObjects}
            setError={setCreateRunError}
            setIsCreatingRun={setIsCreatingRun}
            robotName={name}
          />
        </ApiHostProvider>
      }
    >
      {isCreatingRun ? (
        <Flex justifyContent={ALIGN_FLEX_END}>
          (
          <Icon
            name="ot-spinner"
            marginBottom={SPACING.spacing3}
            spin
            size={SIZE_1}
          />
          )
        </Flex>
      ) : null}
      {storedProtocols.length > 0 ? (
        storedProtocols.map(storedProtocol => {
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
                isError={createRunError != null}
                onClick={() => {
                  setCreateRunError(null)
                  setSelectedProtocol(storedProtocol)
                }}
              >
                <Flex
                  marginRight={SPACING.spacing4}
                  height="6rem"
                  width="6rem"
                  justifyContent={JUSTIFY_CENTER}
                  alignItems={ALIGN_CENTER}
                >
                  <DeckThumbnail
                    commands={storedProtocol.mostRecentAnalysis?.commands ?? []}
                  />
                </Flex>
                <StyledText
                  as="p"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  css={{ 'overflow-wrap': 'anywhere' }}
                >
                  {storedProtocol.mostRecentAnalysis?.metadata?.protocolName ??
                    first(storedProtocol.srcFileNames) ??
                    storedProtocol.protocolKey}
                </StyledText>
                {createRunError != null && isSelected ? (
                  <>
                    <Box flex="1 1 auto" />
                    <Icon
                      name="alert-circle"
                      size="1.25rem"
                      color={COLORS.error}
                    />
                  </>
                ) : null}
              </MiniCard>
              {createRunError != null && isSelected ? (
                <StyledText
                  as="label"
                  color={COLORS.errorText}
                  display={DISPLAY_BLOCK}
                  marginTop={`-${SPACING.spacing2}`}
                  marginBottom={SPACING.spacing3}
                >
                  {createRunError}
                </StyledText>
              ) : null}
            </Flex>
          )
        })
      ) : (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          width="100%"
          minHeight="11rem"
          padding={SPACING.spacing4}
          css={BORDERS.cardOutlineBorder}
        >
          <Icon size="1.25rem" name="alert-circle" color={COLORS.medGrey} />
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            marginTop={SPACING.spacing3}
            role="heading"
          >
            {t('no_protocols_found')}
          </StyledText>
          <StyledText
            as="p"
            marginTop={SPACING.spacing3}
            textAlign={TEXT_ALIGN_CENTER}
          >
            <Trans
              t={t}
              i18nKey="to_run_protocol_go_to_protocols_page"
              components={{ navlink: <Link to="/protocols" /> }}
            />
          </StyledText>
        </Flex>
      )}
    </Slideout>
  )
}

interface CreateRunButtonProps
  extends React.ComponentProps<typeof PrimaryButton> {
  srcFileObjects: File[]
  protocolKey: string
  robotName: string
  setError: (error: string | null) => void
  setIsCreatingRun: (value: boolean) => void
}
function CreateRunButton(props: CreateRunButtonProps): JSX.Element {
  const { t } = useTranslation('protocol_details')
  const history = useHistory()
  const {
    protocolKey,
    srcFileObjects,
    robotName,
    setError,
    setIsCreatingRun,
    disabled,
    ...buttonProps
  } = props
  const {
    createRunFromProtocolSource,
    runCreationError,
    isCreatingRun,
  } = useCreateRunFromProtocol({
    onSuccess: ({ data: runData }) => {
      history.push(`/devices/${robotName}/protocol-runs/${runData.id}`)
    },
  })

  React.useEffect(() => {
    if (runCreationError != null) {
      setError(runCreationError)
    }
  }, [runCreationError, setError])

  React.useEffect(() => {
    setIsCreatingRun(isCreatingRun)
  }, [isCreatingRun, setIsCreatingRun])

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    createRunFromProtocolSource({ files: srcFileObjects, protocolKey })
  }

  return (
    <PrimaryButton
      onClick={handleClick}
      disabled={isCreatingRun || disabled}
      width="100%"
      {...buttonProps}
    >
      {t('proceed_to_setup')}
    </PrimaryButton>
  )
}
