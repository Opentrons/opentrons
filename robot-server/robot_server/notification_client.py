# python 3.8
import random
import logging
import paho.mqtt.client as mqtt
from anyio import to_thread
from fastapi import Depends

from .service.json_api import NotifyRefetchBody
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

HOST = '127.0.0.1' #TOME: Don't forget to change at the end.
PORT = 1883
CLIENT_ID = f'robot-server-{random.randint(0, 1000000)}'
KEEPALIVE = 60
PROTOCOL_VERSION = mqtt.MQTTv5
CLEAN_SESSION = True
DEFAULT_QOS = 2
RETAIN_MESSAGE = False

log = logging.getLogger(__name__)

# TOME: TYPE ALL OF THIS. FORMAT IT CORRECTLY.
# TOME: Don't forget to explain everything. Including the variables above. 
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

    async def disconnect(self):
        self.client.loop_stop()
        await to_thread.run_sync(self.client.disconnect)

    async def publish(self, topic, message = NotifyRefetchBody()): 
        await to_thread.run_sync(self._publish, topic, message)

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            print("Successfully connected to MQTT broker.")
        else:
            print(f"Failed to connect to MQTT broker with reason code: {rc}")

    def _on_disconnect(self, client, userdata, rc, properties=None):
        if rc == 0:
            print("Successfully disconnected from MQTT broker.")
        else:
            print(f"Failed to disconnect from MQTT broker with reason code: {rc}")

    def _publish(self, topic, message):
        payload = message.json()
        self.client.publish(topic=topic, payload=payload, qos=DEFAULT_QOS, retain=RETAIN_MESSAGE)


_notification_client_accessor = AppStateAccessor[NotificationClient]("notification_client")


def initialize_notification_client(app_state: AppState) -> None:
    """Create a new `NotificationClient` and store it on `app_state`

    Intended to be called just once, when the server starts up.
    """
    notification_client = NotificationClient()
    notification_client.connect()
    _notification_client_accessor.set_on(app_state, notification_client)


async def clean_up_notification_client(app_state: AppState) -> None:
    """Clean up the `NotificationClient` stored on `app_state`.

    Intended to be called just once, when the server shuts down.
    """
    notification_client = _notification_client_accessor.get_from(app_state)

    if notification_client is not None:
        await notification_client.disconnect()


def get_notification_client(app_state: AppState = Depends(get_app_state)) -> NotificationClient:
    """Intended to be used by endpoint functions as a FastAPI dependency,
    like `notification_client = fastapi.Depends(get_notification_client)`.
    """
    notification_client = _notification_client_accessor.get_from(app_state)
    return notification_client
