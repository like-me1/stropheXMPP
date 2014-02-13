'use strict';

var sensdash_services = angular.module('sensdash.services', ['ngResource']);

sensdash_services.factory('Sensor', ['$resource',
    function ($resource) {
        return $resource('api/sensors/:sensorId', {}, {
            query: {method: 'GET', params: {sensorId: ''}, isArray: true}
        });
    }]);

sensdash_services.factory('XMPP', function () {
    var BOSH_SERVICE = 'http://likepro.co/http-bind/';
    var PUBSUB_SERVER = 'pubsub.likepro.co';
    var PUBSUB_NODE = 'pubsub.sensors';
    var xmpp = {
        connection: {connected: false},
        connect: function (jid, pwd, callback) {
            xmpp.connection = new Strophe.Connection(BOSH_SERVICE);
            xmpp.connection.connect(jid, pwd, callback);
        },
        subscribe: function (node, on_subscribe) {
            xmpp.connection.pubsub.subscribe(
                xmpp.connection.jid,
                PUBSUB_SERVER,
                PUBSUB_NODE + '.' + node.id,
                [],
                xmpp.handle_incoming,
                on_subscribe);
        },
        handle_incoming: function (message) {
            if (!xmpp.connection.connected) {
                return true;
            }
            var server = "^" + Client.pubsub_server.replace(/\./g, "\\.");
            var re = new RegExp(server);
            if ($(message).attr('from').match(re)) {
                var _data = $(message).children('event')
                    .children('items')
                    .children('item')
                    .children('entry').text();

                if (_data) {
                    // Data is a tag, try to extract JSON from inner text
                    console.log("Data received", _data);
                    var json_obj = JSON.parse($(_data).text());
                }
            }
            return true;
        }
    };
    return xmpp
})

sensdash_services.factory('User', ['XMPP', function (xmpp) {
    var user = {
        favorites: [],
        subscriptions: [],
        profile: {},
        save: function (property) {
            xmpp.connection.private.set(property, property + ":ns", user[property], function (data) {
                    console.log(property + " saved: ", data);
                },
                console.log);
        },
        load: function () {
            xmpp.connection.private.get("profile", "profile:ns", function (data) {
                    user.profile = data;
                },
                console.log);
            xmpp.connection.private.get("subscriptions", "subscriptions:ns", function (data) {
                    user.subscriptions = data;
                },
                console.log)
        },
        subscribe: function (node) {
            xmpp.subscribe(node, function () {
                user.subscriptions.push(node);
                console.log("subscribed to", node.id)
            });
        }
    };
    if (xmpp.connection.connected) {
        user.load();
    }
    return user
}]);