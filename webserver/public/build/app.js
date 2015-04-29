!function(){"use strict";var e=angular.module("watchmenApp",["ngRoute","angularSpinner","ngTable","angularMoment","watchmenControllers","watchmenServices"]);e.config(["$routeProvider",function(e){e.when("/details/:host/:service",{templateUrl:"service-detail.html",controller:"ServiceDetailCtrl"}).otherwise({templateUrl:"service-list.html",controller:"ServiceListCtrl"})}])}(),function(){"use strict";window.Charting=window.Charting||{},Charting.renderLatencyChart=function(e){var t=Utils.parseArrayObjectsForCharting(e.data);return t.data.splice(0,0,"Latency"),t.labels.splice(0,0,"x"),c3.generate({size:e.size,bindto:e.id,data:{x:"x",columns:[t.labels,t.data],types:{Latency:"line"},colors:{Latency:"green"}},axis:{y:{max:e.max||0},x:{type:"timeseries",tick:{format:e.x_format||"%H:%M"}}},tooltip:{format:{title:function(e){return"Latency for "+moment(e).format("DD/MMM HH:mm")},value:function(e){return e+" ms."}}}})}}(),function(){"use strict";function e(e,t){var r={page:1,count:t||10,debugMode:!0};return window.localStorage&&window.localStorage.getItem(e)?JSON.parse(window.localStorage.getItem(e)):r}function t(t,r,a,n,i){return new r(e(t,i),{total:a[t].length,getData:function(e,r){var i=a[t];r.total(i.length);var o=r.sorting()?n("orderBy")(i,r.orderBy()):i,s=o.slice((r.page()-1)*r.count(),r.page()*r.count());e.resolve(s);var l={sorting:r.sorting(),count:r.count(),page:r.page()};window.localStorage&&window.localStorage.setItem(t,JSON.stringify(l))}})}var r,a=3e3,n=angular.module("watchmenControllers",[]);n.controller("ServiceListCtrl",["$scope","$filter","$timeout","Service","ngTableParams","usSpinnerService",function(e,n,i,o,s,l){var c={loading:function(){l.spin("spinner-1"),e.loading=!0},loaded:function(){l.stop("spinner-1"),e.loading=!1}},u="tableServicesData";c.loading(),e[u]=[],e.tableParams=t(u,s,e,n,25),function g(e,t){function n(){i.cancel(r),r=i(function(){g(e,t)},a)}function o(t){e.errorLoadingServices="Error loading data from remote server",console.error(t),n()}e.services=t.getAll(function(t){e.errorLoadingServices=null,e[u]=t,e.tableParams.reload(),e.servicesDown=t.filter(function(e){return e.data&&"error"===e.data.status}).length,c.loaded(),n()},o)}(e,o)}]),n.controller("ServiceDetailCtrl",["$scope","$filter","$routeParams","Service","ngTableParams","usSpinnerService",function(e,r,a,n,i,o){o.spin("spinner-1"),e.loading=!0,e.showConfig=!1,e.serviceDetails=n.getDetails({serviceId:a.host+","+a.service},function(a){o.stop("spinner-1"),e.loading=!1,angular.forEach(a,function(t,r){e[r]=t}),e.tableCriticalLogs=t("critical_events",i,e,r,10),e.tableWarningLogs=t("latency_warnings_last_24_hours",i,e,r,10);var n,s={height:200};a.latency_last_week_mean&&(n=2*a.latency_last_week_mean),a.latency_last_hour_list.length>20&&(e.showLastHourChart=!0,Charting.renderLatencyChart({data:a.latency_last_hour_list,id:"#chart-last-hour",size:s,max:n})),a.latency_last_24_hours_list.length>6&&(e.showLast24Chart=!0,Charting.renderLatencyChart({data:a.latency_last_24_hours_list,id:"#chart-last-24-hours",size:s,max:n})),a.latency_last_week_list.length>3&&(e.showLastWeekChart=!0,Charting.renderLatencyChart({data:a.latency_last_week_list,id:"#chart-last-week",size:s,x_format:"%d/%m",max:n}))})}])}(),function(){"use strict";var e=1e4,t="services-cache",r=angular.module("watchmenServices",["ngResource"]);r.factory("Service",["$resource","$cacheFactory",function(r,a){var n=a("watchmen-Services");return{getAll:function(a){var i=n.get(t);if(i){if(!(i.expiration<+new Date))return a(i.data);i=null}return i||(i=r("services",{},{query:{method:"GET",isArray:!0}}).query(a),n.put(t,{data:i,expiration:+new Date+e})),i},getDetails:function(e,t){return r("services?host=:host&service=:service",{},{query:{method:"GET",isArray:!0,cache:a.get("$http")}}).get(e,t)}}}])}(),function(){"use strict";window.Utils=window.Utils||{},Utils.parseArrayObjectsForCharting=function(e){for(var t=[],r=[],a=0;a<e.length;a++)t.push([e[a].t]),r.push(Math.round([e[a].l]));return{labels:t,data:r}}}();