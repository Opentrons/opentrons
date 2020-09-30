# Opentrons Update Server

An HTTP server for updating software, firmware, and configration files
on Opentrons robots

## Design considerations

The absolute most vital task that this server can perform is to ensure
that it is able to boostrap itself without failing. Whenever the update
server receives an update to itself, it must test the new install and
ensure that it is able to boot and receive a successive update. To
guarantee this, the update server should install a potential update in
a virtual environment and boot the new server, then ship an update to
it (the successive update could be the same wheel as the new server
itself). If it is able to boot and accept a health check and an update,
then it should be installed and the server restarted so the new update
server takes effect.

This test is optional (though preferred) for updating configuration
files and other applications, such as the API server.

## Developement Environment and Testing

To set up the development environment, see the contributing guide in the
root of the [Opentrons/opentrons repository](https://github.com/Opentrons/opentrons).

To test the update server, open a terminal to this directory and enter:

```bash
make setup
make test
make lint
```

To run a development server (assuming this project is already installed)
open a terminal to this directory and enter:

```
make dev
```

Once the server boots, you will see a message including the address on which
the server is listening for requests.
