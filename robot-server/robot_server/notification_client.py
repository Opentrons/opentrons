# noqa: D100

from typing import Any, Dict, Optional
from enum import Enum
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

log: logging.Logger = logging.getLogger(__name__)


class MQTT_QOS(Enum):
    QOS_0 = 0
    QOS_1 = 1
    QOS_2 = 2


class NotificationClient:  # noqa: D101
    def __init__(
        self,
        host: str = "127.0.0.1",
        port: int = 1883,
        keepalive: int = 60,
        protocol_version: int = mqtt.MQTTv5,
        default_qos: MQTT_QOS = MQTT_QOS.QOS_1,
        retain_message: bool = False,
    ) -> None:
        """Returns a configured MQTT client."""
        self._host = host
        self._port = port
        self._keepalive = keepalive
        self._default_qos = default_qos.value
        self._retain_message = retain_message
        # MQTT is somewhat particular about the client_id format and will connect erratically
        # if an unexpected string is supplied. This clientId is derived from the paho-mqtt library.
        self._client_id: str = f"robot-server-{random.randint(0, 1000000)}"
        self.client: mqtt.Client = mqtt.Client(
            client_id=self._client_id, protocol=protocol_version
        )
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

    def connect(self) -> None:
        """Connect the client to the MQTT broker."""
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

        self.client.connect(host=self._host, port=self._port, keepalive=self._keepalive)
        self.client.loop_start()

    async def disconnect(self) -> None:
        """Disconnect the client from the MQTT broker."""
        self.client.loop_stop()
        await to_thread.run_sync(self.client.disconnect)

    async def publish(
        self, topic: str, message: NotifyRefetchBody = NotifyRefetchBody()
    ) -> None:
        """Asynchronously Publish a message on a specific topic to the MQTT broker.

        Args:
            topic: The topic to publish the message on.
            message: The message to be published, in the format of NotifyRefetchBody.
        """
        await to_thread.run_sync(self._publish, topic, message)

    def _publish(self, topic: str, message: NotifyRefetchBody) -> None:
        """Publish a message on a specific topic to the MQTT broker.

        Args:
            topic: The topic to publish the message on.
            message: The message to be published.
        """
        payload = message.json()
        self.client.publish(
            topic=topic,
            payload=payload,
            qos=self._default_qos,
            retain=self._retain_message,
        )

    def _on_connect(
        self,
        client: mqtt.Client,
        userdata: Any,
        flags: Dict[str, Any],
        rc: int,
        properties: Optional[mqtt.Properties] = None,
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

    def _on_disconnect(self, client: mqtt.Client, userdata: Any, rc: int) -> None:
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


_notification_client_accessor: AppStateAccessor[NotificationClient] = AppStateAccessor[
    NotificationClient
]("notification_client")


def initialize_notification_client(app_state: AppState) -> None:
    """Create a new `NotificationClient` and store it on `app_state`.

    Intended to be called just once, when the server starts up.
    """
    notification_client: NotificationClient = NotificationClient()
    _notification_client_accessor.set_on(app_state, notification_client)

    try:
        notification_client.connect()
    except Exception as error:
        log.info(f"Could not successfully connect to notification server: {error}")


async def clean_up_notification_client(app_state: AppState) -> None:
    """Clean up the `NotificationClient` stored on `app_state`.

    Intended to be called just once, when the server shuts down.
    """
    notification_client: Optional[
        NotificationClient
    ] = _notification_client_accessor.get_from(app_state)

    if notification_client is not None:
        await notification_client.disconnect()


def get_notification_client(
    app_state: AppState = Depends(get_app_state),
) -> Optional[NotificationClient]:
    """Intended to be used by endpoint functions as a FastAPI dependency."""
    notification_client: Optional[
        NotificationClient
    ] = _notification_client_accessor.get_from(app_state)
    return notification_client
