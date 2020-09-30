// @flow

export const mockHealthResponse = {
  name: 'opentrons-dev',
  api_version: '1.2.3',
  fw_version: '4.5.6',
  system_version: '7.8.9',
}

export const mockServerHealthResponse = {
  name: 'opentrons-dev',
  apiServerVersion: '1.2.3',
  updateServerVersion: '1.2.3',
  smoothieVersion: '4.5.6',
  systemVersion: '7.8.9',
}

export const mockHealthErrorJsonResponse = {
  status: 401,
  body: { message: 'API responded with error' },
}

export const mockHealthErrorStringResponse = {
  status: 504,
  body: 'NGINX gateway timeout',
}

export const mockHealthFetchErrorResponse = {
  status: -1,
  body: 'Failed to fetch',
}
