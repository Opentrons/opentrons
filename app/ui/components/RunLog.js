import React, {Component} from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from './RunLog.css'

export default class RunLog extends Component {
  componentDidUpdate () {
    if (this.refs.ensureVisible) this.refs.ensureVisible.scrollIntoView(true)
  }

  render () {
    const {style} = this.props
    // hardcoded nested commands for style updates need to add {commands back to props when coming from API}
    const nestedCommands =
      [
        {
          id: 0,
          description: 'foo',
          handledAt: '2017-08-30T12:00:00Z',
          isCurrent: true,
          children: [
            {
              id: 1,
              description: 'bar',
              handledAt: '2017-08-30T12:00:01Z',
              isCurrent: true,
              children: [
                {
                  id: 2,
                  description: 'baz',
                  handledAt: '2017-08-30T12:00:02Z',
                  isCurrent: false,
                  children: []
                },
                {
                  id: 3,
                  description: 'qux',
                  handledAt: '',
                  isCurrent: false,
                  children: []
                }
              ]
            }
          ]
        },
        {
          id: 4,
          description: 'fizzbuzz',
          handledAt: '',
          isCurrent: false,
          children: []
        }
      ]

    const getChildCommands = (parent, level) => {
      return parent.children.map((child, index) => {
        let {id, isCurrent, description} = child
        let groupKey = `${level}-${index}-${id}`
        let props = {
          key: id,
          className: classnames({[styles.current]: isCurrent}, styles[level])
        }
        return (
          <span key={groupKey}><p {...props}>[{id}] : {description}</p>
            {getChildCommands(child, 'tertiary')}
          </span>
        )
      })
    }

    const commandItems = nestedCommands.map((command, index) => {
      let {id, isCurrent, description} = command
      let groupKey = `primary-${index}-${id}`
      let props = {
        key: id,
        className: classnames({[styles.current]: isCurrent})
      }
      return (
        <span key={groupKey}>
          <p {...props}>[{id}] : {description}</p>
          {getChildCommands(command, 'secondary')}
        </span>
      )
    })

    return (
      <section className={classnames(style, styles.run_log_wrapper)}>
        {getChildCommands({nestedCommands}, 'primary')}
        {commandItems}
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
