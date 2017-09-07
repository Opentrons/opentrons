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
                  isCurrent: true,
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

    const makeCommandToTemplateMapper = (depth) => (command) => {
      const {id, isCurrent, description, children, handledAt} = command
      const style = [styles[`indent-${depth}`]]
      const contents = [
        <p className={style} data-timestamp={handledAt}>[{id}] : {description}</p>
      ]

      if (children.length) {
        contents.push(
          <ol>
            {children.map(makeCommandToTemplateMapper(depth + 1))}
          </ol>
        )
      }

      return (
        <li
          key={id}
          className={classnames({[styles.current]: isCurrent}, style)}
        >
          {contents}
        </li>
      )
    }

    const commandItems = nestedCommands.map(makeCommandToTemplateMapper(0))

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
