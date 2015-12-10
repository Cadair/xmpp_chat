export DOMAIN=localhost
export XMPP_DOMAIN=localhost

export DB_USER=kaiwa
export DB_PASS=hello

export LDAP_DOMAIN=localhost
export LDAP_PASS=hello
export LDAP_DN="dc=$DOMAIN"
export LDAP_GROUP=cadair
export LDAP_ORG=cadair

if [ -f environment.local.sh ]; then
    source environment.local.sh
fi
