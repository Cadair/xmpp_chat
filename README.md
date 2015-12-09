XMPP Server
-----------

This is all about configuring an XMPP based replacement for slack. Primarily
this is based on the needs of the SunPy project. The basic requirements for
this project are:

* Provide a Multi-user chat interface.
* Provide integration with GitHub, Travis and other services.
* Provide a bridge to the IRC channel.
* Provide a web interface to the chat service.
* Provide high-quality Android and iOS apps.

XMPP with an IRC bridge and the kaiwa web interface have been chosen to provide
this setup.

1. [Prosody Server](http://prosody.im/).
2. [biboumi](http://biboumi.louiz.org/) IRC Bridge.
3. [Kaiwa](http://getkaiwa.com/) Web interface / server configuration.


Installation / Configuration Notes
----------------------------------

The Kaiwa server can be deployed onto Digital Ocean, which spins up a set of
Docker containers. The first step is to reconstrcut this series of containers
locally, and then create a development environment out of them.

## Kaiwa Server Details

Kaiwa server is a combination of the Prosody server, a LDAP server,
a PostgresSQL database and a web interface. The LDAP server is used to store
user details, and both the kaiwa web interface and the prosdy server talk to
it.

The precise use of the Postgres database is not yet clear.

The web interface is a web interface.

## Docker Containers

Found in this repo is a copy of the DO deploy script (in js) which contains the
commands used to create and configure the containers.

### Docker Compose

There are 4 docker containers needed for the base Kaiwa install:

* postgres
* ldap
* kaiwa-server (prosody)
* kaiwa (web)

These are detailed in the `docker-compose.yml` file.







TODO List
---------

1. Set up the docker containers using docker-compose.
1. Add biboumi to the set of containers, and get the IRC bridge working.


Other Links Etc
---------------

This might be worth looking into: https://github.com/normanr/irc-transport
