"""Constants for the system server."""

REGISTRATION_AUDIENCE = "com.opentrons.robot.register"

AUTHORIZATION_AUDIENCE = "com.opentrons.robot.authorize"

# JWT for registration should last two years.
REGISTRATION_DURATION_DAYS = 365 * 2
