import React, { Component } from 'react';
import styles from './Move.css';

class Move extends Component {
  render() {
    return (
      <div>
        <button onClick={move('x', 10, 'relative')} />
        <button onClick={move('x', -10, 'relative')} />
        <button onClick={move('y', 10, 'relative')} />
        <button onClick={move('y', -10, 'relative')} />
      </div>
    );
  }
}

export default Move;
