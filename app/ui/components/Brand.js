import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './Brand.css';

export default class Home extends Component {
  render() {
    const { version } = this.props
    return (
      <div className={styles.brand}>
        <img src="../ui/img/logo_2x.png" alt="ot-app" />
        <span>{ version }</span>
      </div>
    )
  }
}