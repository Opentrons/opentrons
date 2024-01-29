import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { actions as stepsActions } from '../../../ui/steps'
import { TerminalItemId } from '../../../steplist'
import styles from './styles.module.css'

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
