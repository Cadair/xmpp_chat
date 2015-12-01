FROM library/ubuntu:latest

COPY users.ldif /root/users.ldif

RUN apt-get update
RUN LC_ALL=C DEBIAN_FRONTEND=noninteractive apt-get install -y ldap-utils

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*


#CMD while ! ping -c1 ldap &>/dev/null; do :; done && 
CMD ldapadd -h ldap -x -D $LDAP_DN  -w $LDAP_PWD -f /root/users.ldif
