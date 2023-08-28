import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { WizardPane } from './WizardPane'
import { JogControls } from '../../molecules/JogControls'

interface AdjustLocationProps {
  proceed: () => void
  goBack: () => void
}
export function AdjustLocation(props: AdjustLocationProps): JSX.Element {
  const { proceed, goBack } = props
  const { t, i18n } = useTranslation('robot_controls')

  return (
    <WizardPane
      {...{ proceed, goBack }}
      proceedButtonText={i18n.format(t('confirm_position'), 'capitalize')}
    >
      <JogControls
        jog={() => {
          console.log('TODO: jog')
        }}
        isOnDevice={true}
      />
    </WizardPane>
  )
}
