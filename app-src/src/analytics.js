module.exports = { trackEvent }

function intercomTrackEvent (event, metadata) {
  if (typeof window.Intercom !== "function") {
    return
  }
  try {
    window.Intercom(event, metadata)
  } catch(err) {}
}

function gaTrackEvent (event, metadata) {
  if (typeof window.ga !== "function") {
    return
  }
  try {
  window.ga('send', 'App', event)
  } catch(err) {}
}


function trackEvent (event, metadata) {
    console.log(`[Event] ${event} Metadata: ${metadata}`)
    intercomTrackEvent(event, metadata)
    gaTrackEvent(event, metadata)
}
