module.exports = { trackEvent, trackEventFromWebsocket }

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

function dataLayerTrackEvent (event, metadata) {
  if (typeof window.ot_dataLayer.push !== 'function') {
    return
  }
  try {
    let eventArg = {event: event, payload: {value: event}}
    console.log('[dataLayer Push] ', JSON.stringify(eventArg))
    window.ot_dataLayer.push(eventArg)
  } catch (err) {
    console.log(err)
  }
}

function trackEventFromWebsocket (data) {
  if (!data.command_description) {
    return
  }
  if (data.command_description.startsWith('Successfully uploaded')) {
    dataLayerTrackEvent('PROTOCOL_UPLOAD_SUCCESS')
  }
  if (data.command_description.startsWith('Run complete in')) {
    dataLayerTrackEvent('PROTOCOL_RUN_SUCCESS')
  }
  if (data.command_description.startsWith('Error in')) {
    dataLayerTrackEvent('PROTOCOL_UPLOAD_ERROR')
  }
}

function trackEvent (event, metadata) {
  console.log(`[Event] ${event} Metadata: ${metadata}`)
  intercomTrackEvent(event, metadata)
  // gaTrackEvent(event, metadata)
  dataLayerTrackEvent(event, metadata)
}
