module.exports = { dataLayerTrackEvent, trackEvent, trackEventFromWebsocket }

function dataLayerTrackEvent (event, payloadValue) {
  if (!window.ot_dataLayer) {
    return
  }
  try {
    let eventArg = {event: event, payload: {value: payloadValue || event}}
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
  if (data.command_description.startsWith('Run complete in')) {
    dataLayerTrackEvent('PROTOCOL_RUN_SUCCESS')
  }
}

function trackEvent (event, metadata) {
  const metadataStr = JSON.stringify(metadata)
  console.log(`[Event] ${event} Metadata: ${metadataStr}`)
  dataLayerTrackEvent(event, metadata)
}
