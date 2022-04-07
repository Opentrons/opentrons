import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { SPACING } from '@opentrons/components'

import { Slideout } from '../../atoms/Slideout'
import { PrimaryButton } from '../../atoms/Buttons'
import { StyledText } from '../../atoms/text'

import { useCreateRunFromProtocol } from '../ChooseRobotSlideout/useCreateRunFromProtocol'

import type { StyleProps } from '@opentrons/components'
import type { Robot } from '../../redux/discovery/types'
import type { StoredProtocolData } from '../../redux/protocol-storage'

interface ChooseProtocolSlideoutProps extends StyleProps {
  robot: Robot
  onCloseClick: () => void
  showSlideout: boolean
}
export function ChooseRobotSlideout(
  props: ChooseProtocolSlideoutProps
): JSX.Element | null {
  const { t } = useTranslation(['device_details', 'shared'])
  const { robot, showSlideout, onCloseClick, ...restProps } = props
  const { name } = robot
  const [
    selectedProtocol,
    setSelectedProtocol,
  ] = React.useState<StoredProtocolData | null>(null)

  return (
    <Slideout
      isExpanded={showSlideout}
      onCloseClick={onCloseClick}
      zIndex="10"
      height={`calc(100vh - ${SPACING.spacing4})`}
      title={t('choose_protocol_to_run', { name })}
      footer={
        <ApiHostProvider
          hostname={selectedProtocol != null ? selectedProtocol.ip : null}
        >
          <CreateRunButton
            disabled={selectedProtocol == null}
            protocolKey={selectedProtocol != null ? selectedProtocol.protocolKey :  ''}
            srcFileObjects={selectedProtocol != null ? selectedProtocol.srcFiles : []}
            robotName={name}
          />
        </ApiHostProvider>
      }
      {...restProps}
    ></Slideout>
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
