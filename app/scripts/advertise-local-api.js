// simple script to advertise a MDNS service for local API
// TODO(mc, 2017-10-31): remove this file once API can advertise for itself
const bonjour = require('bonjour')()
const randomstring = require('randomstring')
const request = require('superagent')

const LOCAL_API_POLL_INTERVAL_MS = 5000
const LOCAL_API_HOST = 'localhost'
const LOCAL_API_PORT = 31950
const LOCAL_API_HEALTH_URL = `http://${LOCAL_API_HOST}:${LOCAL_API_PORT}/health`

const id = randomstring.generate({
  length: 6,
  charset: 'hex',
  capitalization: 'uppercase'
})
const name = `Opentrons Beta ${id}`
const service = {
  name,
  host: 'localhost',
  port: 31950,
  // TODO(mc, 2017-10-26): we're relying right now on the fact that resin
  // advertises an SSH service. Instead, we should be registering an HTTP
  // service on port 31950 and listening for that instead
  type: 'http'
}

startPolling()

function startPolling () {
  setTimeout(pollAndPublish, LOCAL_API_POLL_INTERVAL_MS)
}

function pollAndPublish () {
  request.get(LOCAL_API_HEALTH_URL)
    .ok((response) => response.status === 200)
    .then(() => {
      console.log(`Found local API at ${LOCAL_API_HOST}:${LOCAL_API_PORT}`)
      publish()
    })
    .catch(startPolling)
}

function publish () {
  bonjour.publish(service)
    .on('up', () => {
      console.log(`Published MDNS service "${service.name}" on ${service.host}`)
    })
    .on('error', (error) => {
      console.error('Error publishing MDNS service', error)
      // retry
      startPolling()
    })
}
