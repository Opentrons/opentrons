// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import robot from './robot';

const rootReducer = combineReducers({
  robot,
  router,
});

export default rootReducer;
