import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from './RunLog.css'

export default function RunLog (props) {
  const {isConnected, style, commands} = props

  return (
    <main className={classnames(style, styles.wrapper)}>
      {commands.map((command) =>
        <p key={command.id} className={classnames({[styles.current]: command.isCurrent})}>[{command.id}] : {command.description}</p>
      )}
    </main>
  )
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
