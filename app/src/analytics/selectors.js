// @flow
import {createSelector} from 'reselect'

import {
  getProtocolType,
  getProtocolCreatorApp,
  getProtocolName,
  getProtocolSource,
  getProtocolAuthor,
  getProtocolContents,
} from '../protocol'

import hash from './hash'

import type {OutputSelector} from 'reselect'
import type {State} from '../types'
import type {ProtocolAnalyticsData} from './types'

type ProtocolDataSelector = OutputSelector<State, void, ProtocolAnalyticsData>

const _getUnhashedProtocolAnalyticsData: ProtocolDataSelector = createSelector(
  getProtocolType,
  getProtocolCreatorApp,
  getProtocolName,
  getProtocolSource,
  getProtocolAuthor,
  getProtocolContents,
  (type, app, name, source, author, contents) => ({
    protocolType: type || '',
    protocolAppName: app.name || '',
    protocolAppVersion: app.version || '',
    protocolName: name || '',
    protocolSource: source || '',
    protocolAuthor: author || '',
    protocolText: contents || '',
  })
)

// TODO(mc, 2019-01-22): it would be good to have some way of caching these
// hashes; reselect isn't geared towards async, so perhaps RxJS / observables?
export function getProtocolAnalyticsData (
  state: State
): Promise<ProtocolAnalyticsData> {
  const data = _getUnhashedProtocolAnalyticsData(state)
  const hashTasks = [hash(data.protocolAuthor), hash(data.protocolText)]

  return Promise.all(hashTasks).then(result => {
    const [protocolAuthor, protocolText] = result

    return {...data, protocolAuthor, protocolText}
  })
}
