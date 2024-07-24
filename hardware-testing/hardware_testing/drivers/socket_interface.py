import socket
import time


class Server:
    def __init__(self, port):
        self.port = port
        self.server_socket = None

    def initial_server(self):
        try:
            # 创建socket对象
            self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server_socket.settimeout(6)
            # 获取本地机器的IP地址
            localhost = socket.gethostbyname(socket.gethostname())
            # 绑定socket到地址
            self.server_socket.bind((localhost, self.port))
            # 监听连接请求，最多同时连接5个
            self.server_socket.listen(5)
        except ConnectionError as e:
            print(e)

    def send_and_receive(self, cmd: str, delay_s: float, buffer=1024):
        """
        send cmd and receive message
        """
        # 接受一个新的连接
        client_socket, client_address = self.server_socket.accept()
        # 发送一个响应消息给客户端
        response_message = cmd.encode('utf-8')
        client_socket.send(response_message)
        # 接收客户端发送的数据
        time.sleep(delay_s)
        received_message = client_socket.recv(buffer)  # 1024是接收数据的缓冲区大小
        received_message_str = received_message.decode('utf-8')
        client_socket.close()
        return received_message_str


if __name__ == '__main__':
    server = Server(49846)
    server.initial_server()
    for i in range(100):
        data = server.send_and_receive("GetMValue", 2)
        print(data)
