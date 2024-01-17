# python 3.8

import random
import logging

import paho.mqtt.client as mqtt
from anyio import to_thread

HOST = 'broker.emqx.io'
PORT = 1883
CLIENT_ID = f'robot-server-{random.randint(0, 1000000)}'
KEEPALIVE = 60
PROTOCOL_VERSION = mqtt.MQTTv5
CLEAN_SESSION = True
DEFAULT_QOS = 1
RETAIN_MESSAGE = True

TOPIC_PREFIX = "robot-server"

log = logging.getLogger(__name__)


class NotifyData:
    def __init__(self, topic, message):
        self.topic = topic
        self.message = message

# TOME: TYPE ALL OF THIS!
class NotificationClient:
    def __init__(self):
        self.client = mqtt.Client(client_id=CLIENT_ID, protocol=PROTOCOL_VERSION)
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

    def connect(self):
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

        self.client.connect(host=HOST, port=PORT, keepalive=KEEPALIVE)
        self.client.loop_start()

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()

    async def publish(self, topic, message): 
        await to_thread.run_sync(self._publish, topic, message)

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            print("Succesfully connected to MQTT broker.")
        else:
            print(f"Failed to connect to MQTT broker with reason code: {rc}")

    def _on_disconnect(self, client, userdata, rc, properties=None):
        if rc == 0:
            print("Succesfully disconnected from MQTT broker.")
        else:
            print(f"Failed to disconnect from MQTT broker with reason code: {rc}")

    def _publish(self, topic, message):
        payload = message.json()
        self.client.publish(topic=topic, payload=payload, qos=DEFAULT_QOS, retain=RETAIN_MESSAGE)


notification_client = NotificationClient()