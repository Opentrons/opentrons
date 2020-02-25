// @flow

export const formatLoaderMessage = (
  connectingTo: ?string,
  diconnectingFrom: ?string
) =>
  connectingTo
    ? `Attempting to connect to network ${connectingTo}`
    : `Attempting to disconnect from network ${diconnectingFrom}`
