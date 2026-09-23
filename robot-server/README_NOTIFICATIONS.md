# Introduction

This document describes the robot's _notifications API._ The notifications API informs clients of when events happen on the robot. For example, it can inform a client when a run completes.

# API overview

The notifications API is built on [MQTT 5][mqtt]. The robot exposes an MQTT broker on the standard port, 1883. Through standard MQTT mechanisms, a client should open a single connection to the broker and subscribe to the topics that it's interested in.

Our MQTT topics mostly mirror our HTTP API. For instance, the MQTT topic `robot-server/deck_configuration` will get a notification any time the HTTP endpoint `GET /deck_configuration` changes. See [our source code][topics] for the list of currently available topics.

Our MQTT messages are JSON objects, which might contain any of the following properties:

- ```json
  {
    "refetch": true
  }
  ```

  If `refetch` exists and is `true`, that is the signal that something has changed on the robot. The client should refetch the relevant resource through the HTTP API.

- ```json
  {
    "unsubscribe": true
  }
  ```

  If `unsubscribe` exists and is `true`, the topic will not receive any more notifications. The client should unsubscribe from that topic to spare resources on the server.

# Finer points

## The notifications API is read-only

Because of the way MQTT works, clients can technically use it to send arbitrary messages to each other, using the robot as a relay. Don't do that, please. It's an accidental artifact of the implementation, not an API that we intend to support. Only read MQTT messages, never send MQTT messages.

If you need to send data from client to client, use the `/clientData` HTTP endpoints instead. A client can get notified of new data the same way as any other robot API endpoint: subscribe to the `robot-server/clientData` MQTT topic, and issue a new HTTP `GET` request any time it receives a `"refetch": true` message.

## Subscribing to updates without any gaps

If a client does this, it has a bug. The resource might change between step 1 and step 2, and the client won't notice.

1. Do an HTTP `GET` to retrieve the initial value of a resource.
2. Subscribe to the MQTT topic.
3. Do a new HTTP `GET` any time an MQTT notification comes through.

Instead, the client must do this:

1. Subscribe to the MQTT topic.
2. **Wait for the subscription to be acknowledged by the broker.** The details of how to do this will depend on the MQTT client library, but at a low level, the client needs to wait for the MQTT `SUBACK` message.
3. _Then_ do an HTTP `GET` to retrieve the initial value of a resource.
4. _Then_ do a new HTTP `GET` any time an MQTT notification comes through.

## Tolerating spurious updates

For implementation reasons, the server may send notifications even when nothing has actually changed.

If the client is doing something where that would be harmful, like sending a chat message any time a run completes, it should diff the HTTP `GET` results to confirm that something has actually changed.

[mqtt]: https://en.wikipedia.org/wiki/MQTT
[topics]: ./robot_server/service/notifications/topics.py

## Versioning and compatibility

Changes to this API are rare. However, we reserve the right to make breaking changes when we have a good reason, such as improving performance, fixing bugs, or supporting new product features. Our release notes will not necessarily mention breaking changes to this API.
