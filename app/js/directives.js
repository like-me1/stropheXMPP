'use strict';

var sensdash_directives = angular.module('sensdash.directives', []);

sensdash_directives.directive('favorite', function (User) {
    return {
        restrict: 'A',
        templateUrl: 'partials/blocks/favorite_button_block.html',
        link: function ($scope, element, attrs) {
            $scope.user = User;
            $scope.add_to_favorite = function (sensor) {
                if ($scope.user.favorites.indexOf(sensor.id) == -1) {
                    $scope.user.favorites.push(sensor.id);
                    $scope.user.save('favorites');
                    console.log("Added to favorites:", sensor.id);
                }
            };
            $scope.delete_from_favorite = function (sensor) {
                if ($scope.user.favorites.indexOf(sensor.id) != -1) {
                    $scope.user.favorites.splice($scope.user.favorites.indexOf(sensor.id), 1);
                    $scope.user.save('favorites');
                    console.log("Removed from favorites:", sensor.id);
                }
            };
            $scope.check_favorite = function (x) {
                return ($scope.user.favorites.indexOf(x) != -1);
            };
        }
    };
});

sensdash_directives.directive('chart', function (Graph) {
    return {
        restrict: 'A',
        template: '',
        link: function ($scope, element, attrs) {
            var chart = $(element).highcharts($scope.sensor.template, function (chart) {
                Graph.addChart($scope.sensor.id, chart)
            });
        }
    };
});

sensdash_directives.directive('navbar', function ($location, $timeout, XMPP, User, $cookies) {
    return {
        restrict: 'A',
        templateUrl: 'partials/nav_bar.html',
        link: function ($scope, element, attrs) {
            $scope.user = User;
            $scope.xmpp = XMPP;
            $scope.process = "";
            $scope.in_progress = false;
            $scope.user = {
                'jid': $cookies.myID,
                'pass': $cookies.myToken,
                'name': '',
                'signedIn': false
            };
            $scope.isActive = function (x) {
                return (x == $location.path());
            };
            $scope.disconnect = function () {
                $scope.xmpp.connection.flush();
                $scope.xmpp.connection.disconnect();
                $scope.process = "";
            };
            $scope.login = function () {
                if ($scope.user.jid) {
                    $scope.xmpp.connect($scope.user.jid, $scope.user.pass, update_connection);
                    $scope.process = "connecting...";
                }
            };
            var update_connection = function (status) {
                if (status == Strophe.Status.CONNECTING) {
                    $scope.in_progress = true;
                    console.log('connecting...');
                } else if (status == Strophe.Status.CONNFAIL) {
                    console.log('XMPP failed to connect.');
                    $scope.process = "connection failed";
                    $scope.in_progress = false;
                } else if (status == Strophe.Status.DISCONNECTING) {
                    $scope.in_progress = true;
                    console.log('XMPP is disconnecting...');
                } else if (status == Strophe.Status.AUTHFAIL) {
                    console.log('XMPP authentication failed');
                    $scope.process = "Authentication failed";
                    $scope.xmpp.connection.flush();
                    $scope.xmpp.connection.disconnect();

                } else if (status == Strophe.Status.DISCONNECTED) {
                    console.log('XMPP disconnected.');
                    $scope.in_progress = false;
                    User.init();
                    $scope.xmpp.connection.connected = false;
                    $scope.$apply(function () {
                        $location.path("/registry");
                    });
                } else if (status == Strophe.Status.CONNECTED) {
                    console.log('XMPP connection established.');
                    $scope.xmpp.connection.send($pres().tree());
                    // Login was successful, save cookies
                    $scope.process = "";
                    $scope.in_progress = false;
                    $cookies.myID = $scope.user.jid;
                    $cookies.myToken = $scope.user.pass;
                    User.reload();
                }
            };
            $scope.login();

        }
    };
});