import requests
import asyncio
import json


class IPCMessenger(asyncio.Protocol):
    def __init__(self, message, on_con_lost):
        self.message = message
        self.on_con_lost = on_con_lost

    def connection_made(self, transport):
        transport.write(self.message.encode())
        print('Data sent: {!r}'.format(self.message))

    def data_received(self, data):
        print('Data received: {!r}'.format(data.decode()))

    def connection_lost(self, exc):
        print('The server closed the connection')
        self.on_con_lost.set_result(True)


async def main():
    url = "http://localhost:4000/"

    loop = asyncio.get_running_loop()

    on_con_lost = loop.create_future()
    message = 'Hello World!'

        # Example echo method
    payload = {
        "method": "inline",
        "params": {"data": 2},
        "jsonrpc": "2.0",
        "id": 0,
    }

    transport, protocol = await loop.create_connection(
        lambda: IPCMessenger(json.dumps(payload), on_con_lost),
        '127.0.0.1', 4000)

    # Wait until the protocol signals that the connection
    # is lost and close the transport.
    try:
        await on_con_lost
    finally:
        transport.close()

if __name__ == "__main__":
    asyncio.run(main())
