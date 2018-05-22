import React, {Component} from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import styles from './styles.css'
import SessionAlert from './SessionAlert'

export default class CommandList extends Component {
  componentDidUpdate () {
    if (this.refs.ensureVisible) this.refs.ensureVisible.scrollIntoView(true)
  }

  render () {
    const {commands, sessionStatus} = this.props
    const makeCommandToTemplateMapper = (depth) => (command) => {
      const {id, isCurrent, isLast, description, children, handledAt} = command
      const style = [styles[`indent-${depth}`]]
      let nestedList = null

      if (children.length) {
        nestedList = (
          <ol className={styles.list}>
            {children.map(makeCommandToTemplateMapper(depth + 1))}
          </ol>
        )
      }

      const liProps = {
        key: id,
        className: cx(style, {
          [styles.executed]: handledAt,
          [styles.current]: isCurrent,
          [styles.last_current]: isLast
        })
      }

      if (isLast) liProps.ref = 'ensureVisible'

      return (
        <li {...liProps}>
          <p className={style}>[{id}] : {description}</p>
          {nestedList}
        </li>
      )
    }

    const commandItems = commands.map(makeCommandToTemplateMapper(0))
    // TODO (ka 2018-5-21): Temporarily hiding error to avoid showing smoothie error on halt,
    // error AlertItem would be useful for future errors
    const showAlert = (sessionStatus !== 'running' && sessionStatus !== 'loaded' && sessionStatus !== 'error')
    return (
      <div className={styles.run_page}>
      <SessionAlert {...this.props} className={styles.alert}/>
      <section className={cx(styles.run_log_wrapper, {[styles.alert_visible]: showAlert})}>
        <ol className={styles.list}>
          {commandItems}
        </ol>
      </section>
      </div>
    )
  }
}

CommandList.propTypes = {
  // TODO(mc, 2017-08-23): use PropTypes.shape instead of object
  commands: PropTypes.arrayOf(PropTypes.object).isRequired
}
