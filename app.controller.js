(function() {
  'use strict';

  angular.module('nodmonit', ['ui.router', 'templates'])
    .config(function($stateProvider, $urlRouterProvider, $locationProvider) {
      $locationProvider.html5Mode({ enabled: true, requireBase: false });

      // Now set up the states
      $stateProvider
        .state('node_new', {
          url: '/nodes/new',
          templateUrl: "node-new.html"
        })
        .state('node_view', {
          url: '/nodes/:id',
          templateUrl: "node-view.html"
        })
        .state('notification_center', {
          url: '/notification-center',
          templateUrl: "notification-center.html"
        })
        .state('index', {
          url: '/',
          templateUrl: "index.html"
        })
    })
    .filter('unsafe', function($sce) { return $sce.trustAsHtml; })
    .filter('formatBytes', function() {
    	return function(bytes, suffix) {
        if(!bytes || isNaN(bytes)) return 0
        var precision = 1
        if(typeof suffix == 'undefined') suffix = 'B'
    		if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
    		if (typeof precision === 'undefined') precision = 1;
        bytes *= 1024
    		var units = [suffix, 'k'+suffix, 'M'+suffix, 'G'+suffix, 'T'+suffix, 'P'+suffix],
    			number = Math.floor(Math.log(bytes) / Math.log(1024));
    		var re = (bytes / Math.pow(1024, Math.ceil(number))).toFixed(precision),
            split = (re+'').split('.')

        if(split[1] == '0'){
          return split[0] +  ' ' + units[number]
        }
        return re +  ' ' + units[number]
    	}
    })
    .run(['$rootScope', '$location', function ($rootScope, $location) {
        var locationSearch = {};
        var data = {};

        $rootScope.$on('$stateChangeStart',
            function (event, toState, toParams, fromState, fromParams) {
                //save location.search so we can add it back after transition is done
                locationSearch = $location.search();
                ////pass objects between states by using the data property
                //toState.data = angular.extend({}, fromState.data, fromState.nextStateData);
                //toState.nextStateData = {};
            }
        );

        $rootScope.$on('$stateChangeSuccess',
            function (event, toState, toParams, fromState, fromParams) {
                //restore search term to url
                $location.search(locationSearch);
            }
        );
    }])
    .controller('AppController', function($scope, $state, $rootScope){
      var ctrl = this;

      $rootScope.app = ctrl
      
      ctrl.menu = 'nodes'
      ctrl.style = SKIN
      ctrl.auth = AUTH
      ctrl.displayskin = DISPLAYSKIN
      ctrl.endpoint = ENDPOINT
      ctrl.isOk = function(){
        return AUTH && ENDPOINT
      }

      $rootScope.$on('$stateChangeStart',
      function(event, toState, toParams, fromState, fromParams){
        if(fromState.timeout){
          clearTimeout(fromState.timeout)
        }
      })
    })

})();
