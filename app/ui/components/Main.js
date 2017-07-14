import React, { Component } from 'react';
import { Switch, Route } from 'react-router';

import Home from './Home'
import Calibrate from './Calibrate'
import Run from './Run'
import Load from './Load'
import Welcome from './Welcome'
import Status from './Status'

export default class Main extends Component {
  render() {
    const { move, home, load, run, robotState } = this.props;

    return (
      <div>
        <div>
          <Home />
        </div>
        <div>
          <Switch>
            <Route path="/" render={ () => (<Welcome />) } />
            <Route path="/load" render={ () => (<Load load />) } />
            <Route path="/calibrate" render={ () => (<Calibrate robotState move />)} />
            <Route path="/run" render={ () => (<Run robotState run/>) } />
            <Route path="/welcome" render={ () => (<Welcome />) } />
          </Switch>
        </div>
        <div>
          <Status />
        </div>
      </div>
    )
  }
}
