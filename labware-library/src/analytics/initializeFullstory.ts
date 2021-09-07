// @ts-nocheck
'use strict'
import { _setAnalyticsTags } from './fullstory'
const FULLSTORY_NAMESPACE = 'FS'
const FULLSTORY_ORG = process.env.OT_LL_FULLSTORY_ORG
export const initializeFullstory = (): void => {
  console.debug('initializing Fullstory')
  // NOTE: this code snippet is distributed by Fullstory, last updated 2019-10-04
  global._fs_debug = false
  global._fs_host = 'fullstory.com'
  global._fs_org = FULLSTORY_ORG
  global._fs_namespace = FULLSTORY_NAMESPACE
  ;(function (m, n, e, t, l, o, g, y) {
    if (e in m) {
      if (m.console && m.console.log) {
        m.console.log(
          'FullStory namespace conflict. Please set window["_fs_namespace"].'
        )
      }
      return
    }
    g = m[e] = function (a, b, s) {
      g.q ? g.q.push([a, b, s]) : g._api(a, b, s)
    }
    g.q = []
    o = n.createElement(t)
    o.async = 1
    o.crossOrigin = 'anonymous'
    o.src = 'https://' + global._fs_host + '/s/fs.js'
    y = n.getElementsByTagName(t)[0]
    y.parentNode.insertBefore(o, y)
    g.identify = function (i, v, s) {
      g(l, { uid: i }, s)
      if (v) g(l, v, s)
    }
    g.setUserVars = function (v, s) {
      g(l, v, s)
    }
    g.event = function (i, v, s) {
      g('event', { n: i, p: v }, s)
    }
    g.shutdown = function () {
      g('rec', !1)
    }
    g.restart = function () {
      g('rec', !0)
    }
    g.log = function (a, b) {
      g('log', [a, b])
    }
    g.consent = function (a) {
      g('consent', !arguments.length || a)
    }
    g.identifyAccount = function (i, v) {
      o = 'account'
      v = v || {}
      v.acctId = i
      g(o, v)
    }
    g.clearUserCookie = function () {}
  })(global, global.document, global._fs_namespace, 'script', 'user')

  _setAnalyticsTags()
}
