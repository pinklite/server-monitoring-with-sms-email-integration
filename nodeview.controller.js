(function() {
  'use strict';

  angular.module('nodmonit')
    .controller('NodeViewController', function($scope, $stateParams, $http, $state, $rootScope){
      var ctrl = this,
          node,
          cluster;

      update();
      ctrl.menu = 'overview'

      ctrl.delete = function(){
        if(confirm(i18n("Are you sure you wish to delete this node?"))){
          var opts = apiBase('/nodes/'+$stateParams.id)
          opts.method = 'DELETE'
          $http(opts)
            .then(function(resp){
              if(resp.data == "Demo only"){
                setTimeout(alert.bind(null, "Demo only"), 1)
                return;
              }

              if(resp.data){
                $state.go('index')
              }else{
                alert(i18n("Error deleting your node"))
              }
            })
        }
      }

      ctrl.switch = function($event){
        var el = $event.target.getAttribute('href')
        ctrl.menu = el.replace('#', '')
      }

      function update(){
        if($stateParams.id){
          $http(apiBase('/nodes/'+$stateParams.id+'?'+Date.now()))
            .then(function(resp){
              ctrl.node = node = new Node(resp.data)
              ctrl.stats = resp.data.stats
              ctrl.cluster = cluster = new Cluster(node.cluster)
            })


          $('.node-view [data-type]').each(function(){
            var type = $(this).attr('data-type'),
                $self = $(this).parents('.wrapper-graph');

            $http(apiBase('/nodes/'+$stateParams.id+'/'+type+'/minute?'+Date.now()))
              .then(function(resp){

                if(Array.isArray(resp.data)){
                  ctrl[type] = resp.data
                  resp.data.reverse()
                  var map = resp.data.map(function(dt){
                    var date = new Date(dt.created_at)
                    return [date.getHours() + 'h' + date.getMinutes(), {v: dt.avg, f: dt.avg.toFixed(1) + '%'}]
                  })
                  setTimeout(drawChart.bind(null, map, type), 1000)
                }
              })
          })
          $state.current.timeout = setTimeout(update, 5000)
        }
      }


      function drawChart(dt, type) {
        try {
          var data = new google.visualization.DataTable();
          data.addColumn('string', 'X');
          data.addColumn('number', i18n("Usage"));

          data.addRows(dt);

          var options = {
            hAxis: {
              title: i18n("Time")
            },
            vAxis: {
              title: i18n("Percentage"),
              format: '#\'%\'',
              viewWindow: {min: 0, max: 100}
            }
          };

        var chart = new google.visualization.LineChart(document.getElementById('chart-'+type));
          chart.draw(data, options);
        }catch(e){}
      }
    })
})();
