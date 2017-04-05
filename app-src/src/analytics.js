module.exports = { trackEvent }

function intercomTrackEvent (event, metadata) {
  if (typeof window.Intercom !== 'function') {
    return
  }
  // Intercom will throw an error after 180 are sent
  try {
    window.Intercom(event, metadata)
  } catch (err) {
    console.log(err)
  }
}

function gaTrackEvent (event, metadata) {
  if (typeof window.ga !== 'function') {
    return
  }
  try {
    window.ga('send', 'event', 'App', event)
  } catch (err) {
    console.log(err)
  }
}

function dataLayerTrackEvent (event, metadata) {
  if (typeof window.dataLayer !== 'function') {
    return
  }
  try {
    let eventArg = {event: event, payload: {value: event }}
    console.log(`[dataLayer Push] ${eventArg}`)
    window.dataLayer.push(eventArg)
  } catch (err) {
    console.log(err)
  }
}

function trackEvent (event, metadata) {
  console.log(`[Event] ${event} Metadata: ${metadata}`)
  intercomTrackEvent(event, metadata)
  // gaTrackEvent(event, metadata)
  dataLayerTrackEvent(event, metadata)
}
