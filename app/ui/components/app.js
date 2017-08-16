import React, { Component } from 'react'
import styles from './app.css'

import Connection from './Connection'
import Button from './Button'
import RunControl from './RunControl'

export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      running: true,
      paused: false,
      errors: [],
      run_commands: [
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
        }
      ]
    }
  }
  render () {
    return (
      <div className={styles.run_wrapper}>
        <header className={styles.menu}>
          { !this.state.running &&
            <Button onClick={() => { console.log('run') }} disabled={this.state.running} style={styles.run}>Run Job</Button>
          }
        </header>
        <aside className={styles.sidebar} />
        <div className={styles.connect}>
          <Connection />
        </div>
        <RunControl
          style={styles.run_progress}
          running={this.state.running}
          paused={this.state.paused}
          errors={this.state.errors}
          commands={this.state.run_commands}
        />

        <main className={styles.task} />
      </div>
    )
  }
}
