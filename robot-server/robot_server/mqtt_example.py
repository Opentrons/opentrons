# python 3.8

import random
import time
import logging

from paho.mqtt import client as mqtt_client


broker = 'broker.emqx.io'
port = 1883
topic = "opentrons/test"
# generate client ID with pub prefix randomly
client_id = f'python-mqtt-{random.randint(0, 1000)}'
username = 'emqx'
password = '**********'

log = logging.getLogger(__name__)


client = mqtt_client.Client(client_id)

def connect_mqtt():
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            log.info("Connected to MQTT Broker!")
        else:
            log.info("Failed to connect, return code %d\n", rc)
            
    client.on_connect = on_connect
    # client.tls_set(ca_certs='./server-ca.crt')
    client.username_pw_set(username, password)
    client.connect(broker, port)
    return client


# def publish(client):
#     msg_count = 0
#     while True:
#         time.sleep(1)
#         msg = f"messages: {msg_count}"
#         result = client.publish(topic, msg)
#         # result: [0, 1]
#         status = result[0]
#         if status == 0:
#             log.info(f"Send `{msg}` to topic `{topic}`")
#         else:
#             log.info(f"Failed to send message to topic {topic}")
#         msg_count += 1

def subscribe(client: mqtt_client):
    def on_message(client, userdata, msg):
        print(f"Received `{msg.payload.decode()}` from `{msg.topic}` topic")

    client.subscribe(topic, 2)
    client.on_message = on_message



def run():
    client = connect_mqtt()
    subscribe(client)
    #TOME: Revist this! It may be sufficient to loop forever until you gracefully close the program. IDK. 
    #Realize that this starts an async process. 
    client.loop_start()
    return client