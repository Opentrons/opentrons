import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from './RunLog.css'

export default function RunLog (props) {
  const {isConnected, style} = props
  let currentCommandIndex = 3
  const protocolCommands = [
    {
      uid: 1, // MC: can we generate UIDs on the robot side? Needed for keys only so can be whatever hash is easiest
      timestamp: '2:01:43 PM',
      command_description: 'Picking up tip from <Deck><Slot E3><Container p10tiprack><Well A1>'
    },
    {
      uid: 2,
      timestamp: '2:01:56 PM',
      command_description: 'Aspirating 5 at <Deck><Slot D3><Container template><Well A1>'
    },
    {
      uid: 3,
      timestamp: '2:02:43 PM',
      command_description: 'Picking up tip from <Deck><Slot E3><Container p10tiprack><Well A1>'
    },
    {
      uid: 4,
      timestamp: '2:03:56 PM',
      command_description: 'Aspirating 5 at <Deck><Slot D3><Container template><Well A1>'
    },
    {
      uid: 5,
      timestamp: '2:04:16 PM',
      command_description: 'Aspirating 5 at <Deck><Slot D3><Container template><Well A1>'
    },
    {
      uid: 6,
      timestamp: '2:05:16 PM',
      command_description: 'Aspirating 5 at <Deck><Slot D3><Container template><Well A1>'
    }
  ]
  return (
    <main className={classnames(style, styles.wrapper)}>
      {protocolCommands.map((command, index) =>
        <p key={command.timestamp} className={classnames({ [styles.current]: currentCommandIndex === index })}>{command.timestamp} : {command.command_description}</p>
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
  currentCommandIndex: PropTypes.number,
  protocolCommands: PropTypes.arrayOf(PropTypes.object)
}
