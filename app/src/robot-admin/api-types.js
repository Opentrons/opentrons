// @flow

export type SystemTimeAttributes = {
  systemTime: string,
  ...
}

export type SystemTimeData = {
  id: 'time',
  type: 'SystemTimeAttributes',
  attributes: SystemTimeAttributes,
  ...
}
