import * as React from 'react'
import path from 'path'
import first from 'lodash/first'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { ApiHostProvider } from '@opentrons/react-api-client'
import { useSelector } from 'react-redux'

import {
  SPACING,
  TYPOGRAPHY,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  Flex,
  BORDERS,
  DIRECTION_COLUMN,
  Icon,
  COLORS,
  TEXT_ALIGN_CENTER,
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
            robotName={name}
          />
        </ApiHostProvider>
      }
    >
      {storedProtocols.length > 0 ? (
        storedProtocols.map(storedProtocol => (
          <MiniCard
            key={storedProtocol.protocolKey}
            isSelected={
              selectedProtocol != null &&
              storedProtocol.protocolKey === selectedProtocol.protocolKey
            }
            onClick={() => setSelectedProtocol(storedProtocol)}
          >
            <Flex
              marginRight={SPACING.spacing4}
              height="6rem"
              width="6rem"
              justifyContent={JUSTIFY_CENTER}
              alignItems={ALIGN_CENTER}
            >
              <DeckThumbnail
                commands={storedProtocol.mostRecentAnalysis.commands}
              />
            </Flex>
            <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {storedProtocol.mostRecentAnalysis?.metadata?.protocolName ??
                first(storedProtocol.srcFileNames) ??
                storedProtocol.protocolKey}
            </StyledText>
          </MiniCard>
        ))
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
}
function CreateRunButton(props: CreateRunButtonProps): JSX.Element {
  const { t } = useTranslation('protocol_details')
  const history = useHistory()
  const { protocolKey, srcFileObjects, robotName, ...buttonProps } = props
  const { createRunFromProtocolSource } = useCreateRunFromProtocol({
    onSuccess: ({ data: runData }) => {
      history.push(`/devices/${robotName}/protocol-runs/${runData.id}`)
    },
  })

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    createRunFromProtocolSource({ files: srcFileObjects, protocolKey })
  }

  return (
    <PrimaryButton onClick={handleClick} width="100%" {...buttonProps}>
      {t('proceed_to_setup')}
    </PrimaryButton>
  )
}
