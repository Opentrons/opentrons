import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.css';

export default class Home extends Component {
  render() {
    const { home } = this.props
    return (
      <div>
        <button onClick={home('x')} />
        <button onClick={home('y')} />
        <button onClick={home('z')} />
        <button onClick={home('xyz')} />
      </div>
    )
  }
}
