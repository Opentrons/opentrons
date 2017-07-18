import React, { Component } from 'react'
import styles from './Status.css'

class Status extends Component {
  render() {
    const runLog = this.props.run ||
      // command | run log objects need unique ids
      [
        {
          timestamp: '2:01:43 PM',
          command_description: 'Picking up tip from <Deck><Slot E3><Container p10tiprack><Well A1>'
        },
        {
          timestamp: '2:01:56 PM',
          command_description: 'Aspirating 5 at <Deck><Slot D3><Container template><Well A1>'
        },
        {
          timestamp: '2:02:43 PM',
          command_description: 'Picking up tip from <Deck><Slot E3><Container p10tiprack><Well A1>'
        },
        {
          timestamp: '2:03:56 PM',
          command_description: 'Aspirating 5 at <Deck><Slot D3><Container template><Well A1>'
        },
        {
          timestamp: '2:04:16 PM',
          command_description: 'Aspirating 5 at <Deck><Slot D3><Container template><Well A1>'
        },
        {
          timestamp: '2:05:16 PM',
          command_description: 'Aspirating 5 at <Deck><Slot D3><Container template><Well A1>'
        }
      ]
    return (
      <div>
        <h1 className={styles.title}>Log window</h1>
        <div className={styles.log}>
          {runLog.map((log) =>
            <p key={log.timestamp}>{log.timestamp} : {log.command_description}</p>
          )}
        </div>
      </div>
    )
  }
}

export default Status
