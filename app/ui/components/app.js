import React, { Component } from 'react'
import styles from './app.css'

import Connection from './Connection'
import Button from './Button'
import RunControl from './RunControl'

export default class App extends Component {
  constructor(props){
    super(props)
    this.state = {
      running: true,
      paused: false,
      errors: ['Lost connection with serial port']
    }
  }
  render(){
    return (
      <div className={styles.run_wrapper}>
        <header className={styles.menu}>
          <Button onClick= {() => { console.log('run')}} disabled={this.state.running} style={styles.run}>Run Job</Button>
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
        />

        <main className={styles.task} />
      </div>
    )
  }
}
