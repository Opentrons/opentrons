import * as React from "react"
import { useTranslation } from 'react-i18next'
import { WizardPane } from "./WizardPane"

interface SuccessProps {
  proceed: () => void
}
export function Success(props: SuccessProps): JSX.Element {
  const { proceed } = props
  const { t, i18n } = useTranslation(['robot_controls', 'shared'])
  return (
    <WizardPane {...{proceed }} proceedButtonText={i18n.format(t('shared:exit'), 'capitalize')}>
      TODO: SUCCESS
    </WizardPane>
  )
}