export const mockLegacyHealthResponse = {
  name: 'opentrons-dev',
  api_version: '1.2.3',
  fw_version: '4.5.6',
  system_version: '7.8.9',
  robot_model: 'OT-2 Standard',
}

export const mockOT3HealthResponse = {
  name: 'opentrons-dev',
  api_version: '1.2.3',
  fw_version: '4.5.6',
  system_version: '7.8.9',
  robot_model: 'OT-3 Standard',
  robot_serial: 'this is a flex serial',
}

export const mockOT2HealthResponse = {
  name: 'opentrons-dev',
  api_version: '1.2.3',
  fw_version: '4.5.6',
  system_version: '7.8.9',
  robot_model: 'OT-2 Standard',
  robot_serial: 'this is an ot2 serial',
}

export const mockLegacyServerHealthResponse = {
  name: 'opentrons-dev',
  apiServerVersion: '1.2.3',
  serialNumber: '12345',
  updateServerVersion: '1.2.3',
  smoothieVersion: '4.5.6',
  systemVersion: '7.8.9',
}

export const mockOT3ServerHealthResponse = {
  name: 'opentrons-dev',
  apiServerVersion: '1.2.3',
  serialNumber: 'unknown',
  updateServerVersion: '1.2.3',
  smoothieVersion: '4.5.6',
  systemVersion: '7.8.9',
  robotModel: 'OT-3 Standard',
}

export const mockOT2ServerHealthResponse = {
  name: 'opentrons-dev',
  apiServerVersion: '1.2.3',
  serialNumber: '12345',
  updateServerVersion: '1.2.3',
  smoothieVersion: '4.5.6',
  systemVersion: '7.8.9',
  robotModel: 'OT-2 Standard',
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
