import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { SPACING } from '@opentrons/components'
import { Slideout } from '../../atoms/Slideout'
import { PrimaryButton } from '../../atoms/Buttons'

interface ChooseRobotSlideoutProps {
  protocolKey: string
  onCloseClick: () => void
  showSlideout: boolean
}
export function ChooseRobotSlideout(
  props: ChooseRobotSlideoutProps
): JSX.Element | null {
  const { t } = useTranslation('protocol_details')
  const { protocolKey, showSlideout, onCloseClick } = props
  const [selectedRobot, setSelectedRobot] = React.useState<string | null>(null)

  return (
    <Slideout
      title={t('import_new_protocol')}
      isExpanded={showSlideout}
      onCloseClick={onCloseClick}
      height={`calc(100vh - ${SPACING.spacing4})`}
      zIndex="10"
      footer={
        <PrimaryButton
          onClick={() =>
            console.log(
              'TODO: create run on robot with protocol',
              selectedRobot,
              protocolKey
            )
          }
          width="100%"
        >
          {t('proceed_to_setup')}
        </PrimaryButton>
      }
    >
      TODO choose robot to run protocol with key
      {protocolKey}
    </Slideout>
  )
}
