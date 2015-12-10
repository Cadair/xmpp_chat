FROM library/ubuntu:latest

COPY wait /root/wait

RUN apt-get update
RUN LC_ALL=C DEBIAN_FRONTEND=noninteractive apt-get install -y ldap-utils

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*


CMD bash /root/wait && echo "ldapadd -h ldap -x -D $LDAP_DN  -w $LDAP_ROOTPASS -f /root/users.ldif" && ldapadd -h ldap -x -D $LDAP_DN  -w $LDAP_ROOTPASS -f /root/users.ldif
