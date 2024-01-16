# python 3.8

import random
import logging

import paho.mqtt.client as mqtt
from anyio import to_thread

from robot_server.service.json_api import (
    RequestModel,
    SimpleBody,
    SimpleEmptyBody,
    ResourceLink,
    PydanticResponse,
    Body,
)

from robot_server.maintenance_runs import NoCurrentRunFound

HOST = 'broker.emqx.io'
PORT = 1883
CLIENT_ID = f'robot-server-{random.randint(0, 1000000)}'
KEEPALIVE = 60
PROTOCOL_VERSION = mqtt.MQTTv5
CLEAN_SESSION = True
DEFAULT_QOS = 1
RETAIN_MESSAGE = True

log = logging.getLogger(__name__)

class NotificationClient:
    def __init__(self):
        self.client = mqtt.Client(client_id=CLIENT_ID, protocol=PROTOCOL_VERSION)
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

    def connect(self):
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        # TOME: can we do this asyncronously? Should we? I think you can with anyio?
        self.client.connect(host=HOST, port=PORT, keepalive=KEEPALIVE)
        self.client.loop_start()

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()

    async def publish(self, topic, message): 
        await to_thread.run_sync(self._publish, topic, message)

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        print(f"Connected to MQTT broker with reason code: {rc}")

    def _on_disconnect(self, client, userdata, rc, properties=None):
        if rc != 0:
            print(f"Disconnected from MQTT broker with reason code: {rc}")
        else:
            print("Succesfully disconnected from MQTT broker.")

    # TOME: I think the best way to handle the topic is to do dynamic matching. If it's a certain regex, SEND a response of a certain type that comes from 
    def _publish(self, topic, message):
        if (message != None):
            payload = SimpleBody.construct(data=message).json()
            self.client.publish(topic=topic, payload=payload, qos=DEFAULT_QOS, retain=RETAIN_MESSAGE)
        else:
            payload = NoCurrentRunFound(detail="No maintenance run currently running.")
            self.client.publish(topic=topic, payload=payload, qos=DEFAULT_QOS, retain=RETAIN_MESSAGE)

notification_client = NotificationClient()