// global configs
var ENDPOINT, AUTH, SKIN, LANG, DISPLAYSKIN;

/*! iFrame Resizer (iframeSizer.contentWindow.min.js) - v3.5.8 - 2017-01-17
 *  Desc: Include this file in any page being loaded into an iframe
 *        to force the iframe to resize to the content size.
 *  Requires: iframeResizer.min.js on host page.
 *  Copyright: (c) 2017 David J. Bradshaw - dave@bradshaw.net
 *  License: MIT
 */

(function(){
  angular.module('templates', []) // bugfix

  jQuery(function(){
    setInterval(tooltip, 500)
    function tooltip(){
      $('.tooltip:not(.js-init)').tooltipster({
        side: 'bottom'
      }).addClass('js-init');
    }


  })

  // parse querystring
  var urlParams,
      match,
      pl     = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
      query  = window.location.search.substring(1);

  urlParams = {};

  while (match = search.exec(query))
     urlParams[decode(match[1])] = decode(match[2]);

  var cookieConf = {}
  try {
    cookieConf = JSON.parse(getCookie('conf'))
  }catch(e){}

  AUTH = urlParams.auth || cookieConf.auth
  ENDPOINT = urlParams.endpoint || cookieConf.endpoint
  SKIN = urlParams.skin || cookieConf.skin || 'dark'
  DISPLAYSKIN = typeof urlParams.displayskin == 'string' ? urlParams.displayskin != '0' : (cookieConf.displayskin||true)

  createCookie('conf', JSON.stringify({auth: AUTH, endpoint: ENDPOINT, skin: SKIN, displayskin: DISPLAYSKIN}), 3600*24*365)
})();

function sendParentMsg(msg){
  if(window != parent){
    parent.postMessage(JSON.stringify(msg),"*")
  }
}

function apiBase(url, postData){

  var obj = {
    url: url.indexOf('http') === 0 ? url : (ENDPOINT + url),
    headers: {
      'X-NodMonit-Auth': AUTH
    }
  }
  if(postData){
    obj.method = 'POST'
    obj.data = postData
  }
  return obj
}



function Cluster(name){
  this.name = name
  this.nodes = []
}

Cluster.prototype.pushNode = function(item){
  this.nodes.push(item)
}
Cluster.prototype.getName = function(){
  return this.name ? this.name : i18n("Nodes")
}
Cluster.prototype.haveHealths = function(){
  for(var i in this.nodes){
    var n = this.nodes[i]

    if(n.health_checks && n.health_checks.length > 0){
      return true
    }
  }
  return false;
}

Cluster.prototype.allHealthChecksPassing = function(){
  for(var i in this.nodes){
    var n = this.nodes[i]

    if(n.failing_health_checks && n.failing_health_checks.length > 0){
      return n
    }
  }
  return false;
}

var resourceMap = {}, nodeStatusMap = {};

function Node(node){
  this.raw = node
  this.resources = []
  for(var i in node){
    this[i] = node[i]
  }

  this.resources = this.resources.map(function(x){
    return new ResourceUsage(x)
  })

  if(this.last_ping){
    this.last_ping = new Date(this.last_ping)
  }
}
Node.prototype.getResource = function(type){
  return this.resources.filter(function(x){
    return x.type == type
  })[0]
}
Node.prototype.getStatus = function(){
  return this.getStatusType() == 'ok' ? 'ok' : 'fail'
}

Node.prototype.getStatusType = function(){

  if(!this.last_ping){
    return 'no_data_yet'
  }

  if(this.last_ping_in_secs > 30){
    return 'agent_shutdown'
  }

  for(var i in this.resources){
    var r = this.resources[i]
    if(r.percent >= 80){
      return 'resource_overhead'
    }
  }

  return 'ok'
}

Node.prototype.getShortName = function(){
  return this.id.slice(-8);
}
Node.prototype.getProcessorHz = function(){
  return this.processors[0].mhz*1024
}
Node.prototype.getJSON = function(){
  this.raw.processors.forEach(function(p){
    delete p.flags
  })
  return JSON.stringify(this.raw)
}
Node.prototype.getResources = function(types, orderByPercent){
  var res = this.resources
  if(types){
    res = res.filter(function(x){
      return types.indexOf(x.type) !== -1
    });
  }

  if(orderByPercent){
    res.sort(function(a,b){
      return b.percent - a.percent
    })
  }else{
    res.sort(function(a,b){
      return types.indexOf(a.type) - types.indexOf(b.type)
    })
  }

  return res;
}
Node.prototype.getHealthStatus = function(){
  return this.failing_health_checks > 0 ? 'fail' : 'ok'
}
Node.prototype.getStatusLabel = function(){
  var s = this.getStatusType()

  if(s == 'agent_shutdown'){
    return (nodeStatusMap[s]+'').replace('%d', parseInt(this.last_ping_in_secs))
  }
  return nodeStatusMap[s]
}

function ResourceUsage(re){
  for(var i in re){
    this[i] = re[i]
  }
}

ResourceUsage.prototype.getLabel = function(){
  return resourceMap[this.type]
}

ResourceUsage.prototype.getTooltip = function(){
  var percent = this.percent.toFixed(1) + '%', html;

  if(this.type == 'load'){
    return this.details.last1min.toFixed(1) + ', ' + this.details.last5min.toFixed(1) + ', ' + this.details.last15min.toFixed(1)
  }

  if(this.type == 'cpu' && this.details && this.details.stats){
    var html = []
    this.details.stats.forEach(function(s){
      html.push(s.id + ': '+(s.average*100).toFixed(1) + '%')
    })
    return html.join('<br />');
  }

  return percent
}

ResourceUsage.prototype.getUsedInKb = function(){
  return this.details.total
}

ResourceUsage.prototype.getPercent = function(){
  var p = Math.ceil(this.percent)
  return p > 100 ? 100 : p;
}

String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};


function createCookie(name,value,seconds) {
  if (seconds) {
      var date = new Date();
      date.setTime(date.getTime()+(seconds*1000));
      var expires = "; expires="+date.toGMTString();
  }
  else var expires = "";

  var value = encodeURIComponent(value),
      maxCookieSize = 3000;

  if(value.length > maxCookieSize){
    var slices = [],
        index = 0,
        slice = true;

    while(slice){
      slice = value.slice(index, index+maxCookieSize)

      if(slice){
        slices.push(slice)
        index += maxCookieSize
      }
    }

    var slicesIds = [];
    slices.forEach(function(slice){
      var id = Math.random()
      slicesIds.push(id)
      document.cookie = 'cookie-slice-' + id + '=' + slice + expires + "; path=/";
    })

    document.cookie = name + "=slice" + slicesIds.join('-') + expires + "; path=/";
  }else{
    document.cookie = name + "=" + value + expires + "; path=/";
  }
}

function getCookie(c_name, decode){
  decode = typeof decode === 'undefined' ? true : decode

  var i,x,y,ARRcookies=document.cookie.split(";");
    for (i=0;i<ARRcookies.length;i++){
    x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
    y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
    x=x.replace(/^\s+|\s+$/g,"");

    if (x==c_name){
      var slice = y.slice(0, 5);
      if(slice == 'slice'){
        var ids = y.slice(5).split('-'),
            fullCookie = '';

        ids.forEach(function(id){
          fullCookie += getCookie('cookie-slice-' + id, false)
        })

        return decodeURIComponent(fullCookie);
      }else{
        return decode ? decodeURIComponent(y) : y;
      }
    }
  }
}
