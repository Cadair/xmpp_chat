
var DropletCreator = function(client) {
  this.client = client;
};

DropletCreator.prototype.generateCloudConfig = function(data) {
  return "#cloud-config\n" +
         "packages:\n" +
         "  - git\n" +
         "  - docker.io\n" +
         "  - ldap-utils\n" +
         "runcmd:\n" +
         "  - docker pull orchardup/postgresql\n" +
         "  - docker run -d --name postgres -p 5432:5432 -e POSTGRESQL_DB=kaiwa -e POSTGRESQL_USER=kaiwa -e POSTGRESQL_PASS=" + data.adminPassword + " orchardup/postgresql\n" +
         "  - docker pull nickstenning/slapd\n" +
         "  - docker run -d --name ldap -p 389:389 -e LDAP_DOMAIN=" + data.org.toLowerCase() + " -e LDAP_ORGANISATION=" + data.org + " -e LDAP_ROOTPASS=" + data.adminPassword + " nickstenning/slapd\n" +
         "  - wget -P /root/ https://raw.githubusercontent.com/digicoop/kaiwa-server/master/users.ldif\n" +
         "  - sed 's/admin@example.com/admin@" + data.domain + "/' -i /root/users.ldif\n" +
         "  - sed 's/user1@example.com/" + data.firstUserName.toLowerCase() + "@" + data.domain + "/' -i /root/users.ldif\n" +
         "  - sed 's/adminpass/" + data.adminPassword + "/' -i /root/users.ldif\n" +
         "  - sed 's/user1pass/" + data.firstUserPassword + "/' -i /root/users.ldif\n" +
         "  - sed 's/example.com/" + data.org.toLowerCase() + "/' -i /root/users.ldif\n" +
         "  - sed 's/ExampleDesc/" + data.org + "/' -i /root/users.ldif\n" +
         "  - sed 's/exampleGroup/" + data.org.toLowerCase() + "/' -i /root/users.ldif\n" +
         "  - sed 's/user1/" + data.firstUserName.toLowerCase() + "/' -i /root/users.ldif\n" +
         "  - docker pull sebu77/kaiwa-server\n" +
         "  - docker run -d -p 5222:5222 -p 5269:5269 -p 5280:5280 -p 5281:5281 -p 3478:3478/udp --name prosody --link postgres:postgres --link ldap:ldap -e XMPP_DOMAIN=" + data.domain + " -e DB_NAME=kaiwa -e DB_USER=kaiwa -e DB_PWD=" + data.adminPassword + " -e LDAP_USER_BASE=ou=users,dc=" + data.org.toLowerCase() + " -e LDAP_GROUP_BASE=ou=groups,dc=" + data.org.toLowerCase() + " -e LDAP_DN=cn=admin,dc=" + data.org.toLowerCase() + " -e LDAP_PWD=" + data.adminPassword + " -e LDAP_GROUP=" + data.org.toLowerCase() + " sebu77/kaiwa-server\n" +
         "  - ldapadd -h localhost -x -D cn=admin,dc=" + data.org.toLowerCase() + " -w " + data.adminPassword + " -f /root/users.ldif\n" +
         "  - docker pull sebu77/kaiwa\n" +
         "  - docker run -d -p 80:8000 --name kaiwa --link ldap:ldap -e VIRTUAL_HOST=localhost -e VIRTUAL_PORT=80 -e XMPP_NAME=" + data.org + " -e XMPP_DOMAIN=" + data.domain + " -e XMPP_WSS=ws://" + data.domain + ":5280/xmpp-websocket -e XMPP_MUC=chat." + data.domain + " -e XMPP_STARTUP=groupchat/home%40chat." + data.domain + " -e XMPP_ADMIN=admin -e LDAP_USER_BASE=ou=users,dc=" + data.org.toLowerCase() + " -e LDAP_GROUP_BASE=ou=groups,dc=" + data.org.toLowerCase() + " -e LDAP_DN=cn=admin,dc=" + data.org.toLowerCase() + " -e LDAP_PWD=" + data.adminPassword + " -e LDAP_GROUP=" + data.org.toLowerCase() + " sebu77/kaiwa";
};

DropletCreator.prototype.create = function(data, callback) {
  var self = this;
  var payload = {
    name: "kaiwa",
    region: data.region,
    size: data.size,
    image: "ubuntu-14-04-x64",
    ssh_keys: data.sshKey ? [data.sshKey] : [],
    backups: data.backups || false,
    ipv6: data.ipv6 || false,
    private_networking: false,
    user_data: this.generateCloudConfig(data)
  };

  console.log(payload);

  this.client.post('/droplets', payload, function(err, res) {
    if (err) return callback(err, null);
    callback(null, res.droplet);
  });
};

DropletCreator.prototype.get = function(id, callback) {
  this.client.get('/droplets/' + id, function(err, res) {
    if (err) return callback(err, null);
    callback(null, res.droplet);
  });
};

DropletCreator.prototype.waitForIp = function(id, callback) {
  var self = this;
  var check = function(cb) {
    self.get(id, function(err, droplet) {
      if (err) return callback(err, null);
      var net = droplet.networks;
      if (net.v4 && net.v4.length) {
        callback(null, net.v4[0].ip_address);
      } else {
        setTimeout(check, 10000);
      }
    });
  };
  check();
};

DropletCreator.prototype.waitForStatus = function(id, status, callback) {
  var self = this;
  var check = function() {
    self.get(id, function(err, droplet) {
      if (err) return callback(err, null);
      if (droplet.status === status) {
        callback(null, droplet);
      } else {
        setTimeout(check, 20000);
      }
    });
  };
  check();
};


$(function() {
  var client = new DigitalOceanClient(getQueryStringParam('token'));
  var dropletCreator = new DropletCreator(client);
  var form = $('#dropletForm');
  var main = $('#main');
  var status = $('#status');

  $('input').on({
    keydown: function(e) {
      if (e.which === 32)
        return false;
    },
    change: function() {
      this.value = this.value.replace(/\s/g, "");
    }
  });

  var updateStatus = function(className, message) {
    if (!className) {
      status.hide();
      main.css('visibility', 'visible');
      $('#submitBtn')[0].disabled = false;
    } else {
      main.css('visibility', 'hidden');
      status.show().attr('class', className).find('.message').html(message);
      $(window).scrollTop(0);
    }
  };

  status.find('button').click(function() {
    updateStatus(false);
  });

  var asyncCounter = 0;
  var asyncEnd = function() {
    if (--asyncCounter === 0) {
      updateStatus(false);
    }
  };
  $.each([
    function(cb) {
      client.get('/account/keys', function(err, res) {
        var select = form.find('select[name="sshKey"]');
        $.each(res.ssh_keys, function(i, key) {
          select.append('<option value="' + key.id + '">' + key.name + '</option>');
        });
        cb();
      });
    },
    function(cb) {
      client.get('/regions', function(err, res) {
        var select = form.find('select[name="region"]');
        $.each(res.regions, function(i, region) {
          if (!region.available || region.features.indexOf('metadata') === -1) return;
          select.append('<option value="' + region.slug + '">' + region.name + '</option>');
        });
        cb();
      });
    },
    function(cb) {
      client.get('/sizes', function(err, res) {
        var select = form.find('select[name="size"]');
        $.each(res.sizes, function(i, size) {
          var name = size.slug.toUpperCase() + ", " + size.vcpus + " CPU, " +
                     size.disk + "GB HDD (" + size.price_monthly + "$/month)";
          select.append('<option value="' + size.slug + '">' + name + '</option>');
        });
        select.val('1gb');
        cb();
      });
    }
  ], function(i, func) {
    asyncCounter++;
    func(asyncEnd);
  });

  var serializeForm = function(form) {
    var data = {};
    $.each(form.serializeArray(), function(i, field) {
      data[field.name] = field.value === 'TRUE' ? true : field.value.replace(/\s+/g, '');
    });
    return data;
  };

  var createDroplet = function(data, contributed) {
    updateStatus('loading', 'Creating droplet...' + (contributed ? '<br><strong>Thank you for contributing!</strong>' : ''));
    dropletCreator.create(data, function(err, droplet) {
      if (err) return updateStatus('error', 'Failed to create the droplet');
      dropletCreator.waitForIp(droplet.id, function(err, ip) {
        if (err) return updateStatus('error', 'An error occured while retrieving the IP. Please check your DO account');
        updateStatus('loading', 'Droplet created at <strong>' + ip + '</strong>.' +
          '<br>Now configuring the server (this will take a few minutes)...');
        dropletCreator.waitForStatus(droplet.id, 'active', function(err, droplet) {
          if (err) return updateStatus('error', 'An error occured. Please check your DO account');
          document.location = '/deploy/success.html?ip=' + ip;
        });
      });
    });
  };

  var processPayment = function(data, cb) {
    var handler = StripeCheckout.configure({
      key: STRIPE_KEY,
      image: '/assets/img/favicon.png',
      token: function(token) {
        updateStatus('loading', 'Processing payment...');
        $.ajax({
          type: "POST",
          url: APP_URL + '/charge',
          data: {
            token: token.id,
            email: data['email'],
            amount: data['contribution']
          },
          success: function (res) {
            createDroplet(data, true);
          },
          error: function (err) {
            updateStatus('error', 'An error occured while processing your payment');
          }
        });
      }
    });
    handler.open({
      name: 'Kaiwa',
      description: 'Contribution',
      amount: data['contribution'] * 100,
      email: data['email'],
      panelLabel: "Contribute {{amount}}",
      allowRememberMe: false
    });
  };

  form.submit(function(e) {
    e.preventDefault();
    var data = serializeForm(form);
    var next = createDroplet;

    if (data['contribution'] !== '' && data['contribution'] != 0) {
      if (data['contribution'] < 2) {
        $('#contribution').focus();
        return;
      }
      if (data['email'] === '') {
        form.find('input[name="email"]').focus();
        return;
      }
      next = processPayment;
    }

    $('#submitBtn')[0].disabled = true;
    next(data);
  });

});
