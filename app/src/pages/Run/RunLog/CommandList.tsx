import * as React from 'react'
import cx from 'classnames'

import { SpinnerModal } from '@opentrons/components'
import { SessionAlert } from './SessionAlert'
import { Portal } from '../../../App/portal'
import styles from './styles.css'

import type {
  CommandNode,
  SessionStatus,
  SessionStatusInfo,
} from '../../../redux/robot'

export interface CommandListProps {
  commands: any[]
  sessionStatus: SessionStatus
  sessionStatusInfo: SessionStatusInfo
  showSpinner: boolean
  onResetClick: () => unknown
}

export class CommandList extends React.Component<CommandListProps> {
  componentDidUpdate(): void {
    // TODO(mc, 2018-07-24): use new refs
    // eslint-disable-next-line react/no-string-refs
    if (this.refs.ensureVisible) {
      ;(this.refs.ensureVisible as React.ElementRef<'li'>).scrollIntoView(true) // eslint-disable-line react/no-string-refs
    }
  }

  render(): JSX.Element {
    const {
      commands,
      sessionStatus,
      sessionStatusInfo,
      showSpinner,
      onResetClick,
    } = this.props
    const makeCommandToTemplateMapper = (depth: number) => (
      command: CommandNode
    ): JSX.Element => {
      const {
        id,
        isCurrent,
        isLast,
        description,
        children,
        handledAt,
      } = command
      const style = [styles[`indent-${depth}`]]
      let nestedList = null

      if (children.length) {
        nestedList = (
          <ol className={styles.list}>
            {children.map(makeCommandToTemplateMapper(depth + 1))}
          </ol>
        )
      }

      const liProps: {
        key: string | number
        className: string
        ref?: string
      } = {
        key: id,
        className: cx(style, {
          [styles.executed]: Boolean(handledAt),
          [styles.current]: Boolean(isCurrent),
          [styles.last_current]: Boolean(isLast),
        }),
      }

      if (isLast) liProps.ref = 'ensureVisible'

      return (
        <li {...liProps}>
          {/* @ts-expect-error TODO: this style variable should probably be string and not string[] */}
          <p className={style}>
            [{id}] : {description}
          </p>
          {nestedList}
        </li>
      )
    }

    const commandItems = commands.map(makeCommandToTemplateMapper(0))

    // TODO (ka 2018-5-21): Temporarily hiding error to avoid showing smoothie
    //  error on halt, error AlertItem would be useful for future errors
    const showAlert =
      sessionStatus !== 'running' &&
      sessionStatus !== 'loaded' &&
      sessionStatus !== 'error'

    const wrapperStyle = cx(styles.run_log_wrapper, {
      [styles.alert_visible]: showAlert,
    })

    return (
      <div className={styles.run_page}>
        {showSpinner && (
          <Portal>
            <SpinnerModal />
          </Portal>
        )}
        {!showSpinner && (
          <SessionAlert
            sessionStatus={sessionStatus}
            sessionStatusInfo={sessionStatusInfo}
            onResetClick={onResetClick}
            className={styles.alert}
          />
        )}
        <section className={wrapperStyle}>
          <ol className={styles.list}>{commandItems}</ol>
        </section>
      </div>
    )
  }
}
