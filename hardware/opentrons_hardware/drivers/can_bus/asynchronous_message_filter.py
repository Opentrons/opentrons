def filter_async_messages(arbitration_id: ArbitrationId) -> bool:
    return arbitration_id.parts.message_id == 0

class AsynchronousListener:
    """Helper class for CanMessenger to listen for Asynchronous messages from CAN"""

    def __init__(self, can_messenger: CanMessenger, state_store, node_id: NodeId, message: MessageDefinition, timeout: float, expected_nodes: List[NodeId]):
        self._can_messenger = can_messenger
        self._node_id = node_id
        self._message = message
        self._event = asyncio.Event()
        self._state_store = state_store
        # todo add ability to know how many nodes will ack to a broadcast
        # we can assume at least 3 for the gantry and head boards
        self._async_queue: asyncio.Queue[_AckPacket] = asyncio.Queue()

    def __call__(
        self, message: MessageDefinition, arbitration_id: ArbitrationId
    ) -> None:
        """Called by can messenger when a message arrives."""
        if arbitration_id.parts.originating_node_id not in self._state_store.expected_nodes:
            return
        if isinstance(message, ToolDectionNotification):
            self._state_store.update_tool_state(message, arbitration_id)
        elif isinstance(message, TipSenseNotification):
            self._state_store.update_tip_state(message, arbitration_id)
