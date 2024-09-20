import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Link } from '@opentrons/components'
import { actions as stepsActions } from '../../ui/steps'
import type { TerminalItemId } from '../../steplist'

interface TerminalItemLinkProps {
  terminalId: TerminalItemId
}

export const TerminalItemLink = (props: TerminalItemLinkProps): JSX.Element => {
  const { t } = useTranslation('nav')
  const dispatch = useDispatch()

  const handleClick = (): void => {
    dispatch(stepsActions.selectTerminalItem(props.terminalId))
  }

  return (
    <Link onClick={handleClick}>{t(`terminal_item.${props.terminalId}`)}</Link>
  )
}
