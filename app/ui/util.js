module.exports = {
  getUserEmail,
  getUserId,
  getUserProfile,
  isAuthenticated,
}

function getUserId () {
  return getUserProfile().user_id || null
}

function getUserEmail () {
  return getUserProfile().email || null
}

function getUserProfile () {
  return JSON.parse(localStorage.getItem('profile') || '{}')
}

function isAuthenticated () {
  const profile = localStorage.getItem('profile')
  const idToken = localStorage.getItem('id_token')
  if (profile == null) return false
  if (idToken == null) return false
  return true
}
