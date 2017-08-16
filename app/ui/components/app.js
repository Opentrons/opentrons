import React, {Component} from 'react'
import {connect} from 'react-redux'

import {actions} from '../robot'

import styles from './app.css'

import Connection from './Connection'
import Button from './Button'
import RunControl from './RunControl'

const mapStateToProps = (state) => {
  return {
    isRunning: state.robot.runRequest.inProgress,
    isConnected: state.isConnected
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onRunButtonClick: () => dispatch(actions.run())
  }
}

class App extends Component {
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
    const {isRunning, onRunButtonClick} = this.props
    const {isPaused, errors} = this.state

    return (
      <div className={styles.run_wrapper}>
        <header className={styles.menu}>
          {!isRunning && <Button
            onClick={onRunButtonClick}
            disabled={isRunning}
            style={styles.run}
          >
            Run Job
          </Button>}
        </header>
        <aside className={styles.sidebar} />
        <div className={styles.connect}>
          <Connection />
        </div>
        { isRunning
          ? <RunControl
            style={styles.run_progress}
            isRunning={isRunning}
            isPaused={isPaused}
            errors={errors}
            commands={this.state.run_commands}
          />
          : <section className={styles.run_progress} />
        }
        <main className={styles.task} />
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
