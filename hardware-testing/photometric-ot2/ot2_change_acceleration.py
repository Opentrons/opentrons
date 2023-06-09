from subprocess import run

from opentrons import config

cfg = config.robot_configs.load_ot2()
print(f"Old Acceleration = {cfg.acceleration}")

cfg.acceleration['X'] = 500
cfg.acceleration['Y'] = 500
cfg.acceleration['Z'] = 500
cfg.acceleration['A'] = 500
cfg.acceleration['B'] = 100
cfg.acceleration['C'] = 100
config.robot_configs.save_robot_settings(cfg)
print(f"New Acceleration = {cfg.acceleration}")

print("Restarting \"opentrons-robot-server\".")
print("The App cannot connect until restart is complete.")
print("Please wait 1 minute...")
run(["systemctl", "restart", "opentrons-robot-server"])
print("Done.")
