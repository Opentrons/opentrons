import random
import sys

from opentrons_sdk.drivers.motor import OpenTrons, GCodeLogger

motor = OpenTrons()
if not motor.connect(sys.argv[1]):
	print('failed connecting to port {}'.format(sys.argv[1]))
	sys.exit()

ranges = {
	'x' : 250,
	'y' : 200,
	'z' : 100,
	'a' : 20,
	'b' : 20
}

def rand_move(scale=1.0):
	if scale > 1.0:
		scale = 1.0
	if scale < 0.0:
		scale = 0.0

	kwargs = {}

	for axis in 'xyzab':
		if random.random() < 0.3:
			kwargs[axis] = random.random() * (ranges[axis] * scale)
			kwargs[axis] += (ranges[axis]/2) * (1.0-scale)

	if bool(kwargs):
		print('-->  {}'.format(kwargs))
		motor.move(**kwargs)

try:
	while True:
		print('\nhoming')
		motor.home('abz')
		motor.home('x','y')

		motor.move(**ranges)

		for i in range(random.randint(5,20)):
			rand_move()
			for i in range(random.randint(5,20)):
				rand_move(0.025)

		print('waiting for arrival...')
		motor.wait_for_arrival()
except Exception as e:
	print(e)
	motor.disconnect()