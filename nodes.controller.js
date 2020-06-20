(function() {
  'use strict';

  angular.module('nodmonit')
    .controller('NodesController', function($scope, $http, $sce, $state){

      var ctrl = this,
          nodes = [],
          clusters = [],
          clustersHashtable = {}

      update()

      ctrl.clusters = clusters
      ctrl.switches = {}
      ctrl.loading = true

      ctrl.view = function(node){
        $state.go('node_view', {id: node.id})
      }


      ctrl.getAggregatedByCluster = function(){
        if(clusters.length == 0){
          clustersHashtable = {}

          nodes.forEach(function(node){
            var clust;
            if(!clustersHashtable[node.cluster]){
              clust = new Cluster(node.cluster)
              clustersHashtable[node.cluster] = clust
              clusters.push(clust)
            }
            clustersHashtable[node.cluster].pushNode(new Node(node))
          })


          for(var clusterName in clustersHashtable){
            if(!ctrl.switches[clusterName]){
              ctrl.switches[clusterName] = clustersHashtable[clusterName].nodes.length >= 3 ? 'grid' : 'list'
            }
          }
        }

        clusters.sort(function(a, b) {
          return b.nodes.length - a.nodes.length
        });

        return clusters
      }

      function update(){

        $http(apiBase('/nodes?'+Date.now()))
          .then(function(resp){
            if(Array.isArray(resp.data))
              nodes = resp.data

            clusters = [] // reset
          })
          .finally(function(){
            ctrl.loading = false

            $state.current.timeout = setTimeout(update, 5000)
          })
      }

    })
})();
