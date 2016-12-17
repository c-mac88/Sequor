angular.module('underscore', [])
    .factory('_', function() {
        return window._;
    });

angular.module('sequor', [
    'ionic',
    'angularMoment',
    // 'sequor.directives',
    'sequor.filters',
    'sequor.services',
    'sequor.factories',
    'sequor.config',
    // 'sequor.views',
    'underscore',
    'ngMap',
    'ngResource',
    'ngCordova',
    'slugifier',
    'ion-google-place',
    'ion-datetime-picker',
    'ngInput',
    'ui.bootstrap',
    'ionic.service.core',
    'ionic.service.push'
])

.config(['$ionicAppProvider', function($ionicAppProvider) {
    $ionicAppProvider.identify({
        app_id: '9fd9bf29',
        api_key: 'd7f7ead1a18917ee5435d35b328a3151c047871725e39e6c',
        dev_push: true
    });
}])

.run(function($ionicPlatform, PushNotificationsService, $rootScope, $ionicConfig, $timeout) {

    $rootScope.go = function() {
        window.open("ion-datetime-picker", "_blank");
    };

    Parse.initialize("2cc7c323bdc48c1765d8d8d05e27d720");
    Parse.serverURL = "http://cryptic-escarpment-48353.herokuapp.com/parse";

    $ionicPlatform.on("deviceready", function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }

        PushNotificationsService.register();
    });

    // This fixes transitions for transparent background views
    $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
        if (toState.name.indexOf('app.maps') > -1) {
            // set transitions to android to avoid weird visual effect in the walkthrough transitions
            $timeout(function() {
                $ionicConfig.views.transition('none');
                $ionicConfig.views.swipeBackEnabled(false);
                console.log("setting transition to none and disabling swipe back");
            }, 0);
        }
    });
    $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
        if (toState.name.indexOf('app.feeds-categories') > -1) {
            // Restore platform default transition. We are just hardcoding android transitions to auth views.
            $ionicConfig.views.transition('none');
            // If it's ios, then enable swipe back again
            if (ionic.Platform.isIOS()) {
                $ionicConfig.views.swipeBackEnabled(false);
            }
            console.log("disabling swipe back and restoring transition to platform default", $ionicConfig.views.transition());
        }
    });

    $ionicPlatform.on("resume", function() {
        PushNotificationsService.register();
    });

})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    $stateProvider

     .state('app', {
        url: "/app",
        abstract: true,
        templateUrl: "app/App/side-menu.html",
        controller: 'AppCtrl'
    })

    .state('app.maps', {
        url: "/maps",
        templateUrl: "app/Maps/maps.html",
        controller: 'MapsCtrl'
    })


    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('app/maps');
});
