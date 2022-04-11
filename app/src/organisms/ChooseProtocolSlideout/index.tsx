import * as React from 'react'
import path from 'path'
import first from 'lodash/first'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { ApiHostProvider } from '@opentrons/react-api-client'
import { useSelector } from 'react-redux'

import {
  SPACING,
  TYPOGRAPHY,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  Flex,
} from '@opentrons/components'

import { getStoredProtocols } from '../../redux/protocol-storage'
import { Slideout } from '../../atoms/Slideout'
import { PrimaryButton } from '../../atoms/Buttons'
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
      {storedProtocols.map(storedProtocol => (
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
            <DeckThumbnail analysis={storedProtocol.mostRecentAnalysis} />
          </Flex>
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {storedProtocol.mostRecentAnalysis?.metadata?.protocolName ??
              first(storedProtocol.srcFileNames) ??
              storedProtocol.protocolKey}
          </StyledText>
        </MiniCard>
      ))}
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
  const { createRun } = useCreateRunFromProtocol({
    onSuccess: ({ data: runData }) => {
      history.push(`/devices/${robotName}/protocol-runs/${runData.id}`)
    },
  })

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    createRun(srcFileObjects)
  }

  return (
    <PrimaryButton onClick={handleClick} width="100%" {...buttonProps}>
      {t('proceed_to_setup')}
    </PrimaryButton>
  )
}
