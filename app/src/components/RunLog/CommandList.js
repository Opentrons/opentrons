// @flow
import * as React from 'react'
import cx from 'classnames'
import asciichart from 'asciichart'
import round from 'lodash/round'
import camelCase from 'lodash/camelCase'

import { SpinnerModal } from '@opentrons/components'
import SessionAlert from './SessionAlert'
import { Portal } from '../portal'
import styles from './styles.css'

import type { SessionStatus } from '../../robot'

export type CommandListProps = {|
  commands: Array<any>,
  sessionStatus: SessionStatus,
  showSpinner: boolean,
  onResetClick: () => mixed,
|}

export default class CommandList extends React.Component<CommandListProps> {
  componentDidUpdate() {
    // TODO(mc, 2018-07-24): use new refs
    if (this.refs.ensureVisible) this.refs.ensureVisible.scrollIntoView(true) // eslint-disable-line react/no-string-refs
  }

  render() {
    const { commands, sessionStatus, showSpinner, onResetClick } = this.props
    const makeCommandToTemplateMapper = depth => command => {
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

      const liProps: { key: string, className: string, ref?: string } = {
        key: id,
        className: cx(style, {
          [styles.executed]: handledAt,
          [styles.current]: isCurrent,
          [styles.last_current]: isLast,
        }),
      }

      if (isLast) liProps.ref = 'ensureVisible'

      const cycleCommandMatch = description.match(
        /Thermocycler starting.*: (\[.*\])/
      )
      if (cycleCommandMatch && cycleCommandMatch[1]) {
        const dirtyStages = cycleCommandMatch[1].split(/[)}], /)
        const cleanStages = dirtyStages.map(dirtyStage => {
          if (dirtyStage.includes('(')) {
            const dirtyArgs = dirtyStage.split(',')
            const cleanArgs = dirtyArgs.map(da => da.replace(/[^0-9]*/g, ''))
            return {
              temperature: cleanArgs[0] && Number(cleanArgs[0]),
              holdTime: cleanArgs[1] && Number(cleanArgs[1]),
              rampRate: cleanArgs[2] && Number(cleanArgs[2]),
            }
          } else if (dirtyStage.includes('{')) {
            const dirtyKwargs = dirtyStage.split(',')
            return dirtyKwargs.reduce((acc, dirtyKwarg) => {
              const kwargMatch = dirtyKwarg.match(
                /^[^a-z]([a-z_]*)[^a-z0-9]*([0-9]*)[^0-9]*$/
              )
              if (kwargMatch && kwargMatch[1] && kwargMatch[2]) {
                return {
                  ...acc,
                  [camelCase(kwargMatch[1])]: kwargMatch[2],
                }
              }
            }, {})
          }
        })
        if (cleanStages.length > 0) {
          const xCount = 60
          let chartPoints = new Array(xCount)
          const totalTime = cleanStages.reduce(
            (acc, stage) => acc + stage.holdTime,
            0
          )
          const withPercentages = cleanStages.map(stage => ({
            ...stage,
            holdTimePercentage: round((stage.holdTime / totalTime) * xCount, 0),
          }))
          let lastIndex = 0
          withPercentages.forEach(stage => {
            const stageStart = lastIndex
            while (lastIndex < stage.holdTimePercentage + stageStart) {
              chartPoints[lastIndex] = stage.temperature
              lastIndex++
            }
          })
          const plot = asciichart.plot(chartPoints, { height: 10 })
          console.info(plot)
        }
      }

      return (
        <li {...liProps}>
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
