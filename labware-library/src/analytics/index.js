// @flow

export type AnalyticsEvent = {|
  name: string,
  properties?: Object,
  callback?: () => void,
|}

export const reportEvent = (event: AnalyticsEvent) => {
  const { name, properties, callback } = event
  // TODO IMMEDIATELY: hook up
  console.log('FAKE ANALYTICS!', { name, properties })

  if (callback) {
    callback()
  }
}
