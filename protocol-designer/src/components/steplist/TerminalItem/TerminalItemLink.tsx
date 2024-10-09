import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { actions as stepsActions } from '../../../ui/steps'
import styles from './styles.module.css'
import type { TerminalItemId } from '../../../steplist'

interface Props {
  terminalId: TerminalItemId
}

export const TerminalItemLink = (props: Props): JSX.Element => {
  const { t } = useTranslation('nav')
  const dispatch = useDispatch()

  const handleClick = (): void => {
    dispatch(stepsActions.selectTerminalItem(props.terminalId))
  }

  return (
    <a className={styles.nav_link} onClick={handleClick}>
      {t(`terminal_item.${props.terminalId}`)}
    </a>
  )
}
