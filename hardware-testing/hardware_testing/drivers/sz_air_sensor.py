from hardware_testing.drivers.socket_interface import Server


class AirSensor2:
    def __init__(self, port):
        self.server = Server(port)

    def connect(self):
        """
        initial server
        """
        self.server.initial_server()

    def get_air_params(self):
        """
        send get value
        """
        data = None
        try:
            data = self.server.send_and_receive("GetMValue", 2)
            data_list = data.split('\r\n')
            pressure = data_list[0].split(' ')[0]
            humidity = data_list[1].split(' ')[0]
            temperature = data_list[2].split(' ')[0]
            pressure_diffrence = data_list[3].split(' ')[0]
            return {
                "success": True,
                "data": {
                    "pressure": pressure,
                    "humidity": humidity,
                    "temperature": temperature,
                    "p_difference": pressure_diffrence
                }
            }
        except Exception as e:
            print('Getting data error:\n')
            print(data)
            print(e)
            return {"success": False}


if __name__ == '__main__':
    sensor1 = AirSensor2(49846)
    sensor2 = AirSensor2(49847)
    sensor1.connect()
    sensor2.connect()
    while True:
        ret1 = sensor1.get_air_params()
        ret2 = sensor2.get_air_params()
        print("RET - 1: ")
        print(ret1)
        print("RET - 2: ")
        print(ret2)
