import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styles from './RunControl.css'
import RunNotifications from './RunNotifications'
import RunProgress from './RunProgress'

class RunControl extends Component {
	render(){
		const style = this.props.style
		const running = this.props.running
		const errors = this.props.errors
		const hasError = errors.length > 0 
		const paused = this.props.paused
		const progress = (1 / 3) * 100 
		return(
			<section className={style}>
				<div className={styles.btn_wrapper}>
					{ hasError && <button className={styles.btn_error}>Report Error</button> }
					<button onClick= {() => { console.log('pause')}} className={styles.btn_pause}>Pause</button>
					<button onClick= {() => { console.log('cancel')}} className={styles.btn_cancel}>Cancel Job</button>
				</div>
					
				<RunNotifications {...{running, paused,errors, hasError} }/>	
				
				<div>
				<div className={styles.progress} >
					<span>Time Remaining: 00:03:00</span>
					<RunProgress {...{progress, paused, hasError}} />
				</div>
				</div>
			</section>
		)
	}
}
	
	


RunControl.propTypes = {
  running: PropTypes.bool,
  paused: PropTypes.bool,
  errors: PropTypes.array,
  style:PropTypes.string
}

export default RunControl