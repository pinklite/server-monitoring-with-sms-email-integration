function i18n(str) {
  if(i18n.data && (typeof i18n.data[str] == 'string' || typeof i18n.data[str] == 'number')){
    return i18n.data[str]
  }
  return str
}

(function() {
  'use strict';

  angular.module('nodmonit')
    .filter('trans', function() {
      return i18n
    })
    .controller('I18nController', function($rootScope, $http, $scope){

      $rootScope.loadingLanguage = true
      $scope.i18n = {}

      $http(apiBase('/lang.json'))
        .then(function(resp){
          if(resp.data == 'string'){
            resp.data = JOSN.parse(resp.data)
          }
          i18n.data = resp.data
        })
        .catch(function(e){
          console.log('[INFO] No langfile detected')
        })
        .finally(function(){
          $rootScope.loadingLanguage = false


          nodeStatusMap = {
            'agent_shutdown': i18n("Agent hasn't responded in more than %d seconds"),
            'no_data_yet': i18n("No data received yet"),
            'resource_overhead': i18n("Resource overhead"),
            'ok': i18n("Everything looks ok"),
            'fail': i18n("Something looks wrong")
          }

          resourceMap = {
            mem: i18n('RAM'),
            openfile: i18n('Files'),
            cpu: i18n('CPU'),
            load: i18n('Load'),
            disk: i18n('Disk'),
            swap: i18n('SWAP')
          }
        })
    })

})();
