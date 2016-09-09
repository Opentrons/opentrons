from opentrons_sdk.drivers.motor import OpenTrons, GCodeLogger
import random

motor = OpenTrons()
motor.connect('/dev/tty.usbmodem1421')
motor.resume()

try:
	while True:
		print('\nhoming')
		motor.home('abz')
		motor.home('x','y')

		for i in range(random.randint(5,40)):
			kwargs = {}
			if random.random() < 0.3:
				kwargs['x'] = random.random() * 250
			if random.random() < 0.3:
				kwargs['y'] = random.random() * 200
			if random.random() < 0.3:
				kwargs['z'] = random.random() * 100
			if random.random() < 0.3:
				kwargs['a'] = random.random() * 20
			if random.random() < 0.3:
				kwargs['b'] = random.random() * 20
			if bool(kwargs):
				print('-->  {}'.format(kwargs))
				motor.move(**kwargs)

		print('waiting for arrival...')
		motor.wait_for_arrival()
except Exception as e:
	print(e)
	motor.disconnect()