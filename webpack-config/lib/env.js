'use strict'

const parseEnvVariable = name => {
  const value = process.env[name]

  try {
    return JSON.parse(value)
  } catch (error) {
    return value
  }
}

module.exports = {
  DEV_MODE: parseEnvVariable('NODE_ENV') !== 'production',
  ENABLE_ANALYZER: !!parseEnvVariable('ANALYZER'),
  DEFAULT_PORT: parseEnvVariable('PORT'),
}
