// @flow

export const formatLoaderMessage = (
  connectingTo: ?string,
  diconnectingFrom: ?string
): string => {
  if (connectingTo) {
    return `Attempting to connect to network ${connectingTo}`
  } else if (diconnectingFrom) {
    return `Attempting to disconnect from network ${diconnectingFrom}`
  } else {
    return 'Attempting to connect or disconnect from network'
  }
}
