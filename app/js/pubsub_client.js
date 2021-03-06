var Client = {
  pubsub_server: 'pubsub.' + Config.XMPP_SERVER,
  connection: null,
  subscribed: false,
  show_raw: true,
  show_log: true,

  // log to console if available
  log: function (msg) { 
    if (Client.show_log && window.console) { console.log(msg); }
  },

  // show the raw XMPP information coming in
  raw_input: function (data)  {
    if (Client.show_raw) {
      Client.log('RECV: ' + data);
    }
  },

  // show the raw XMPP information going out
  raw_output: function (data) { 
    if (Client.show_raw) {
      Client.log('SENT: ' + data);
    }
  },

  // simplify connection status messages
  feedback: function(msg, col) {
    $('#connection_status').html(msg).css('color', col);
  },

  // decide what to do with an incoming message
  handle_update: function (data) {
    var _d = $(data);
    var _message = _d.html();
    var _type = _d.attr('type'); 

    switch (_type) {
      case MessageType.MSG_TEXT:
        Client.show_text(_message);
        break;
      case MessageType.MSG_HTML:
        Client.show_html(_message);
        break;
      default:
        Client.log("Oh dear! I don't understand");
    }
  },

  // inject text
  show_text: function (m) {
    $('#message').text(m);
  },

  // inject html
  show_html: function (m) {
    var e = document.createElement('div');
    e.innerHTML = m;
    $('#message').html(e.childNodes[0].nodeValue);
  },

  on_event: function (message) {
    if (!Client.subscribed) {
      return true;
    }

    var server = "^" + Client.pubsub_server.replace(/\./g, "\\.");
    var re = new RegExp(server);

    if ($(message).attr('from').match(re) && $(message).attr('type') == 'headline')
    { 
      var _data = $(message).children('event')
        .children('items')
        .children('item')
        .children('entry').text();

      if (_data) {
        Client.handle_update(_data);
      }
    }

    return true;
  },

  on_subscribe: function (sub) {
    Client.subscribed = true;
    Client.log("Now awaiting messages...");
    Client.feedback('Connected', '#00FF00');

    return true;
  },

  on_connect: function (status) {
    if (status == Strophe.Status.CONNECTING) {
      Client.log('Connecting...');
      Client.feedback('Connecting... (1 of 2)', '#009900');
    } else if (status == Strophe.Status.CONNFAIL) {
      Client.log('Failed to connect!');
      Client.feedback('Connection failed', '#FF0000');
    } else if (status == Strophe.Status.DISCONNECTING) {
      Client.log('Disconnecting...');
      Client.feedback('Disconnecting...', '#CC6600');
    } else if (status == Strophe.Status.DISCONNECTED) {
      Client.log('Disconnected');
      Client.feedback('Disconnected', '#aa0000');
    } else if (status == Strophe.Status.CONNECTED) {
      Client.log("Almost done...");
      Client.feedback('Connecting... (2 of 2)', '#009900');
      Client.connection.send($pres().c('priority').t('-1'));
      }
    return true;
  }
}

$(document).ready(function () {
    // initialize Highcharts
    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });
    $('form.form-signin').submit(function (event) {
        event.preventDefault();
        $this = $(this);
        var jid = $this.find('input#jid').val()
        var pass = $this.find('input#pass').val()
        var conn = new Strophe.Connection(Config.BOSH_SERVICE);
        Client.connection = conn;
        Client.connection.rawInput = Client.raw_input;
        Client.connection.rawOutput = Client.raw_output;
        Client.connection.connect(jid, pass, Client.on_connect);
        $this.html('<h5>'+ jid +'</h5>');
    });
    //temp_chart = new Highcharts.Chart(temp_chart_settings);
});

function subscribe_to_sensor(id) {
    console.log("Subscribing to #" + id);
    Client.connection.pubsub.subscribe(
        Client.connection.jid,
	    'pubsub.' + Config.XMPP_SERVER,
        Config.PUBSUB_NODE + '.' + id,
        [],
        Client.on_event,
        Client.on_subscribe
      );
}
