import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { connect } from 'react-redux'
import { ThunkDispatch } from '../../../types'
import { actions as stepsActions } from '../../../ui/steps'
import { TerminalItemId } from '../../../steplist'
import styles from './styles.css'

interface OP {
  terminalId: TerminalItemId
}
interface DP {
  selectTerminalItem: (terminalItemId: TerminalItemId) => unknown
}
type Props = OP & DP

const TerminalItemLinkComponent: React.FC<Props> = ({
  terminalId,
  selectTerminalItem,
}) => {
  const { t } = useTranslation('nav')

  const handleClick = (): void => {
    selectTerminalItem(terminalId)
  }

  return (
    <a className={styles.nav_link} onClick={handleClick}>
      {t(`terminal_item.${terminalId}`)}
    </a>
  )
}

const mapDTP = (dispatch: ThunkDispatch<any>): DP => ({
  selectTerminalItem: terminalId =>
    dispatch(stepsActions.selectTerminalItem(terminalId)),
})

export const TerminalItemLink = connect(null, mapDTP)(TerminalItemLinkComponent)
