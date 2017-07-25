import React, { Component } from 'react'
import styles from './Upload.css'

export default class Upload extends Component {
  render() {
    return (
      <div className={styles.upload}>
        <button className={styles.btn}>
          <img className={styles.icon} src='../ui/img/plus.png' alt='upload'/>
          <input className={styles.file} type='file' />
        </ button>
        <label className={styles.file_label}>Upload Protocol</label>
      </div>
    )
  }
}