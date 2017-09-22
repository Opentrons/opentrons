import React, {Component} from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from './RunLog.css'

export default class RunLog extends Component {
  componentDidUpdate () {
    if (this.refs.ensureVisible) this.refs.ensureVisible.scrollIntoView(true)
  }

  render () {
    const {style, commands} = this.props
    const makeCommandToTemplateMapper = (depth) => (command) => {
      const {id, isCurrent, isLast, description, children, handledAt} = command
      const style = [styles[`indent-${depth}`]]
      const contents = [
        <p className={style}>[{id}] : {description}</p>
      ]

      if (children.length) {
        contents.push(
          <ol>
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
          {contents}
        </li>
      )
    }

    const commandItems = commands.map(makeCommandToTemplateMapper(0))

    return (
      <section className={classnames(style, styles.run_log_wrapper)}>
        <ol>
          {commandItems}
        </ol>
      </section>
    )
  }
}

/*
Commenting out isRequired for some props for now, using local mock data for first pass
*/
RunLog.propTypes = {
  style: PropTypes.string,
  isConnected: PropTypes.bool.isRequired,
  // TODO(mc, 2017-08-23): use PropTypes.shape (or whatever that method is)
  // instead of object
  commands: PropTypes.arrayOf(PropTypes.object).isRequired
}
