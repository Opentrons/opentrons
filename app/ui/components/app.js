import React, { Component } from 'react'
import styles from './app.css'

import Connection from './Connection'
import Button from './Button'
import RunControl from './RunControl'

export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isRunning: true,
      isPaused: false,
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
          { !this.state.isRunning &&
            <Button onClick={() => { console.log('run') }} disabled={this.state.isRunning} style={styles.run}>Run Job</Button>
          }
        </header>
        <aside className={styles.sidebar} />
        <div className={styles.connect}>
          <Connection />
        </div>
        { this.state.isRunning
          ? <RunControl
            style={styles.run_progress}
            running={this.state.isRunning}
            paused={this.state.isPaused}
            errors={this.state.errors}
            commands={this.state.run_commands}
          />
          : <section className={styles.run_progress} />
        }
        <main className={styles.task} />
      </div>
    )
  }
}
