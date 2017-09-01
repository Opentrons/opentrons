// utility functions

export function getUserId () {
  return getUserProfile().user_id || null
}

export function getUserEmail () {
  return getUserProfile().email || null
}

export function getUserProfile () {
  return JSON.parse(localStorage.getItem('profile') || '{}')
}

export function isAuthenticated () {
  const profile = localStorage.getItem('profile')
  const idToken = localStorage.getItem('id_token')
  if (profile == null) return false
  if (idToken == null) return false
  return true
}

export function makeActionName (moduleName, actionName) {
  return `${moduleName}:${actionName}`
}
