// @flow
import cookie from 'cookie'

export const shutdownFullstory = () => {
  if (window[window['_fs_namespace']]) {
    window[window['_fs_namespace']].shutdown()
  }
  delete window[window['_fs_namespace']]
}

const _setAnalyticsTags = () => {
  const cookies = cookie.parse(global.document.cookie)
  const { ot_email: email, ot_name: displayName } = cookies
  const commit_str = process.env.OT_PD_COMMIT_HASH
  const version_str = process.env.OT_PD_VERSION
  const buildDate_date = new Date((process.env.OT_PD_BUILD_DATE: any))

  // NOTE: fullstory expects the keys 'displayName' and 'email' verbatim
  // though all other key names must be fit the schema described here
  // https://help.fullstory.com/develop-js/137380
  if (window[window['_fs_namespace']]) {
    window[window['_fs_namespace']].setUserVars({
      displayName,
      email,
      commit_str,
      version_str,
      buildDate_date,
      ot_application_name_str: 'protocol-designer', // NOTE: to distinguish from other apps using the org
    })
  }
}

// NOTE: this code snippet is distributed by Fullstory and formatting has been maintained
window['_fs_debug'] = false
window['_fs_host'] = 'fullstory.com'
window['_fs_org'] = process.env.OT_PD_FULLSTORY_ORG
window['_fs_namespace'] = 'FS'

export const initializeFullstory = () => {
  ;(function(m, n, e, t, l, o, g: any, y: any) {
    if (e in m) {
      if (m.console && m.console.log) {
        m.console.log(
          'Fullstory namespace conflict. Please set window["_fs_namespace"].'
        )
      }
      return
    }
    g = m[e] = function(a, b, s) {
      g.q ? g.q.push([a, b, s]) : g._api(a, b, s)
    }
    g.q = []
    o = n.createElement(t)
    o.async = 1
    o.crossOrigin = 'anonymous'
    o.src = 'https://' + global._fs_host + '/s/fs.js'
    y = n.getElementsByTagName(t)[0]
    y.parentNode.insertBefore(o, y)
    g.identify = function(i, v, s) {
      g(l, { uid: i }, s)
      if (v) g(l, v, s)
    }
    g.setUserVars = function(v, s) {
      g(l, v, s)
    }
    g.event = function(i, v, s) {
      g('event', { n: i, p: v }, s)
    }
    g.shutdown = function() {
      g('rec', !1)
    }
    g.restart = function() {
      g('rec', !0)
    }
    g.log = function(a, b) {
      g('log', [a, b])
    }
    g.consent = function(a) {
      g('consent', !arguments.length || a)
    }
    g.identifyAccount = function(i, v) {
      o = 'account'
      v = v || {}
      v.acctId = i
      g(o, v)
    }
    g.clearUserCookie = function() {}
  })(global, global.document, global['_fs_namespace'], 'script', 'user')
  _setAnalyticsTags()
}
