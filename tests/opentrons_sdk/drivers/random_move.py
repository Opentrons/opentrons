import datetime
import random
import sys

from opentrons_sdk.drivers.motor import OpenTrons, GCodeLogger

motor = OpenTrons()
if not motor.connect(sys.argv[1]):
	print('failed connecting to port {}'.format(sys.argv[1]))
	sys.exit()

def date_print(line):
	time_string = str(datetime.datetime.now().time()).split('.')[0]
	print(('{0}: {1}'.format(time_string, line)))

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
			kwargs[axis] = round(kwargs[axis], 3)

	if bool(kwargs):
		send_move(**kwargs)

def send_move(**kwargs):
	date_print('-->  {}'.format(kwargs))
	motor.move(**kwargs):

try:
	while True:

		date_print('\nhoming')

		motor.home('abz')
		motor.home('x','y')

		try:
			send_move(**ranges)

			for i in range(random.randint(5,20)):
				rand_move()
				for i in range(random.randint(5,20)):
					rand_move(0.025)

			date_print('waiting for arrival...')
			motor.wait_for_arrival()
		except RuntimeWarning as e:
			date_print(e)

except Exception as e:
	date_print(e)
	motor.disconnect()