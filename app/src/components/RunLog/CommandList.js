import React, {Component} from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from './styles.css'

export default class CommandList extends Component {
  componentDidUpdate () {
    if (this.refs.ensureVisible) this.refs.ensureVisible.scrollIntoView(true)
  }

  render () {
    const {commands} = this.props
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
        className: classnames(style, {
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

    return (
      <section className={styles.run_log_wrapper}>
        <ol className={styles.list}>
          {commandItems}
        </ol>
      </section>
    )
  }
}

CommandList.propTypes = {
  // TODO(mc, 2017-08-23): use PropTypes.shape instead of object
  commands: PropTypes.arrayOf(PropTypes.object).isRequired
}
