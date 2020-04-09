#!/usr/bin/env python3

from robot_server.settings import RobotServerSettings
with open('settings_schema.json', 'w') as f:
    f.write(RobotServerSettings.schema_json(indent=2))
