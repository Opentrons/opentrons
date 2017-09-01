import React from 'react'
// import classnames from 'classnames'
import Button from './Button'
import styles from './NavPanel.css'

const UploadPanel = props => {
  const recentFiles = ['bradford_assay.py', '384_plate_filling.py', 'dilution_PCR.py'] // should come from props/state
  const files = recentFiles.map((file) => {
    return <p>{file}</p>
  })
  return (
    <div className={styles.nav_panel}>
      <section className={styles.choose_file}>
        <button className={styles.btn_new}>
          New File
        </button>
        <label className={styles.btn_upload} htmlFor='uploaded-file'>
          Upload
           <input className={styles.file} type='file' name='uploaded-file' id='uploaded-file' />
        </label>
        <h2 className={styles.title}>Recently Uploaded</h2>
        {files}
      </section>
    </div>
  )
}

const ConnectPanel = props => {
  const {isConnected, onConnectClick} = props
  let connectButton
  let connectionStatus
  if (!isConnected) {
    connectButton =
      <Button
        onClick={onConnectClick}
        disabled={isConnected}
        style={styles.btn_connect}
      >
        Connect To Robot
      </Button>
    connectionStatus = <h2 className={styles.title}> Robot Detected</h2> // what if no robot detected?
  } else {
    connectButton =
      <Button
        onClick={() => console.log('disconnect')}
        disabled={!isConnected}
        style={styles.btn_connect}
      >
        Disconnect Robot
      </Button>
    connectionStatus = <h2 className={styles.title}> Robot Connected</h2>
  }
  return (
    <div className={styles.nav_panel}>
      <section className={styles.connection_info}>
        {connectionStatus}
      </section>
      <section className={styles.connection_toggle}>
        {connectButton}
      </section>
    </div>
  )
}

const panel = (props) => ({
  upload: <UploadPanel {...props} />,
  connect: <ConnectPanel {...props} />,
  setup: <div>setup</div>
})

export default function NavPanel (props) {
  const {currentNavPanelTask} = props
  return <div >{panel(props)[currentNavPanelTask]}</div>
}
