from __future__ import annotations
from aiohttp import web 
from typing import Optional
from types import TracebackType
from multiprocessing import Process


async def get_authorize(request: web.Request) -> web.Response:
    print("Got a request at /system/authorize")
    return web.Response(body="empty", status=200)

def _run_server(port: int) -> None:
    print(f'Starting system server')
    app = web.Application()
    app.add_routes([
        web.get('/system/authorize', get_authorize)]
    )
    web.run_app(app, host='localhost', port=port, )


class DevSystemServer:
    def __init__(
        self,
        port: int
    ) -> None:
        self.port = port
    
    def __enter__(self) -> DevSystemServer:
        return self
    
    def __exit__(
        self,
        exc_type: Optional[BaseException],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        self.stop()
    
    def __del__(self):
        self.stop()
    
    def start(self) -> None:
        """Run the server in another process."""
        self.thread = Process(
            target=_run_server,
            args=[self.port],
            name='mock-system-server',
            
        )
        self.thread.start()

    def stop(self) -> None:
        """Stop the robot server."""
        if self.thread is not None:
            self.thread.terminate()
            self.thread.join()
            self.thread = None