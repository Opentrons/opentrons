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

HOST = '127.0.0.1'
PORT = 1883
# MQTT is somewhat particular about the client_id format and will connect erratically 
# if an unexpected string is supplied. This clientId is derived from the paho-mqtt library.
CLIENT_ID = f'robot-server-{random.randint(0, 1000000)}'
KEEPALIVE = 60
PROTOCOL_VERSION = mqtt.MQTTv5
CLEAN_SESSION = True
DEFAULT_QOS = 2
RETAIN_MESSAGE = False 

log = logging.getLogger(__name__)


class NotificationClient:
    def __init__(self):
        """Returns a configured MQTT client."""
        self.client: mqtt.Client = mqtt.Client(client_id=CLIENT_ID, protocol=PROTOCOL_VERSION)
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

    def connect(self) -> None:
        """Connect the client to the MQTT broker."""
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

        self.client.connect(host=HOST, port=PORT, keepalive=KEEPALIVE)
        self.client.loop_start()

    async def disconnect(self) -> None:
        """Disconnect the client from the MQTT broker."""
        self.client.loop_stop()
        await to_thread.run_sync(self.client.disconnect)

    async def publish(
            self, 
            topic: str, 
            message: NotifyRefetchBody = NotifyRefetchBody()
    ) -> None:
        """Asynchronously Publish a message on a specific topic to the MQTT broker.
        
        Args:
            topic: The topic to publish the message on.
            message: The message to be published, in the format of NotifyRefetchBody.
        """
        await to_thread.run_sync(self._publish, topic, message)

    def _publish(
            self, 
            topic: str, 
            message: NotifyRefetchBody
    ) -> None:
        """Publish a message on a specific topic to the MQTT broker.
        
        Args:
            topic: The topic to publish the message on.
            message: The message to be published.
        """
        payload = message.json()
        self.client.publish(topic=topic, payload=payload, qos=DEFAULT_QOS, retain=RETAIN_MESSAGE)

    def _on_connect(
            self, 
            client: mqtt.Client, 
            userdata: mqtt._UserData, 
            flags: dict, 
            rc:mqtt.ReasonCodes, 
            properties=None
    ) -> None:
        """Callback invoked when the client is successfully connected to the MQTT broker.
        
        Args:
            client: The MQTT client object.
            userdata: User-defined data associated with the client.
            flags: Response flags from the broker.
            rc: Reason code for the connection result.
            properties: Connection properties, if any.
        """
        if rc == 0:
            log.info("Successfully connected to MQTT broker.")
        else:
            log.info(f"Failed to connect to MQTT broker with reason code: {rc}")

    def _on_disconnect(
            self, 
            client: mqtt.Client, 
            userdata: mqtt._UserData, 
            rc: mqtt.ReasonCodes, 
            properties: mqtt.Properties=None
    ) -> None:
        """Callback invoked when the client is disconnected from the MQTT broker.
        
        Args:
            client: The MQTT client object.
            userdata: User-defined data associated with the client.
            rc: Reason code for the disconnection result.
            properties: Disconnection properties, if any.
        """
        if rc == 0:
            log.info("Successfully disconnected from MQTT broker.")
        else:
            log.info(f"Failed to disconnect from MQTT broker with reason code: {rc}")


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
