import React from 'react'
import PropTypes from 'prop-types'
import ConnectedSetupPanel from '../containers/ConnectedSetupPanel'
import Connection from '../containers/Connection'
import styles from './NavPanel.css'

const UploadPanel = props => {
  return (
    <div className={styles.nav_panel}>
      <section className={styles.choose_file}>
        <label className={styles.btn_upload}>
          Upload
          <input
            className={styles.file}
            type='file'
            onChange={props.onUpload}
          />
        </label>

        <label className={styles.file_drop}>
         Drag and drop protocol
            file here.
          <input
            className={styles.file}
            type='file'
            onChange={props.onUpload}
          />
        </label>

      </section>
    </div>
  )
}

// const ConnectPanel = props => {
//   const {isConnected, onConnectClick, onDisconnectClick} = props
//   let connectButton
//   let connectionStatus
//   if (!isConnected) {
//     connectButton =
//       <Button
//         onClick={onConnectClick}
//         disabled={isConnected}
//         style={styles.btn_connect}
//       >
//         Connect To Robot
//       </Button>
//     connectionStatus = <h2 className={styles.title}> Robot Detected</h2> // what if no robot detected?
//   } else {
//     connectButton =
//       <Button
//         onClick={onDisconnectClick}
//         disabled={!isConnected}
//         style={styles.btn_connect}
//       >
//         Disconnect Robot
//       </Button>
//     connectionStatus = <h2 className={styles.title}> Robot Connected</h2>
//   }
//   return (
//     <div className={styles.nav_panel}>
//       <section className={styles.connection_info}>
//         {connectionStatus}
//       </section>
//       <section className={styles.connection_toggle}>
//         {connectButton}
//       </section>
//     </div>
//   )
// }

// ConnectPanel.propTypes = {
//   isConnected: PropTypes.bool.isRequired,
//   onConnectClick: PropTypes.func.isRequired,
//   onDisconnectClick: PropTypes.func.isRequired
// }

const PANELS_BY_NAME = {
  upload: UploadPanel,
  connect: Connection,
  setup: ConnectedSetupPanel
}

export default function NavPanel (props) {
  const {currentNavPanelTask} = props

  if (!(currentNavPanelTask in PANELS_BY_NAME)) return null

  const Panel = PANELS_BY_NAME[currentNavPanelTask]

  return (
    <Panel {...props} />
  )
}

NavPanel.propTypes = {
  isConnected: PropTypes.bool.isRequired,
  currentNavPanelTask: PropTypes.string.isRequired,
  onUpload: PropTypes.func.isRequired
}
