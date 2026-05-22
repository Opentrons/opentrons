import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import styles from './ModuleContainer/modulecontainer.module.css'

interface ModuleStatusContainerProps {
  title: string
  children: React.ReactNode
}
export const ModuleStatusContainer = (
  props: ModuleStatusContainerProps
): JSX.Element => {
  const { t } = useTranslation('protocol_visualization')
  const { title, children } = props
  return (
    <div className={styles.module_details_status}>
      <StyledText desktopStyle="bodyDefaultRegular">{t(title)}</StyledText>
      {children}
    </div>
  )
}
