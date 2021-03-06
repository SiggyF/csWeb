﻿module Charts {
    'use strict'
    /**
      * Config
      */
    var moduleName = 'csWeb.charts';

    /**
      * Module        
      */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) { 
        // named module does not exist, so create one                                             
        myModule = angular.module(moduleName, []);
    }

    declare var String;

    export interface ISparklineScope extends ng.IScope {
        timestamps: number[];
        sensor    : number[];
        width?    : number;
        height?   : number;
        margin?   : { top: number; right: number; bottom: number; left: number; };
        showaxis? : boolean; 
    }

    export interface IBarchartScope extends ng.IScope {
        data: number[];
    }

    /**
      * Directive to create a sparkline chart.
      *
      * @seealso: http://odiseo.net/angularjs/proper-use-of-d3-js-with-angular-directives
      * @seealso: http://cmaurer.github.io/angularjs-nvd3-directives/sparkline.chart.html
      * @seealso: http://www.tnoda.com/blog/2013-12-19
      */
    myModule
        .directive('sparklineChart', ['$filter',
        function ($filter): ng.IDirective {
            return {
                terminal: true,       // do not compile any other internal directives 
                restrict: 'EA',       // E = elements, other options are A=attributes and C=classes
                scope: {
                    timestamps: '=',  // = means that we use angular to evaluate the expression,
                    sensor    : '=',
                    showaxis  : '=',
                    width     : '@',  // the value is used as is
                    height    : '@',
                    margin    : '@'
                },
                //controller: [
                //    '$scope',
                //    '$element',
                //    '$attrs',
                //    function ($scope, $element, $attrs) {
                //        $scope.d3Call    = function (data, chart) {
                //            ChartHelpers.checkElementID($scope, $attrs, $element, chart, data);
                //        };
                //    }
                //],
                link: function (scope: ISparklineScope, element, attrs) {
                    var margin           = scope.margin || { top: 15, right: 5, bottom: 0, left: 10 };
                    var width            = scope.width || 100;
                    var height           = scope.height || 70;
                    var showAxis         = typeof scope.showaxis !== 'undefined' && scope.showaxis;
                    var cursorTextHeight = 12;// + (showAxis ? 5 : 0); // leave room for the cursor text (timestamp | measurement)
                    var chart = d3.select(element[0])
                        .append('svg:svg')
                        .attr('width', width)
                        .attr('height', height);

                    var marginAxis = showAxis
                        ? { top: 0, right: 0, bottom: 20, left: 10 }
                        : { top: 0, right: 0, bottom: 0, left: 0 };

                    var x = d3.scale.linear().range([margin.left + marginAxis.left, width - margin.left - margin.right - marginAxis.left - marginAxis.right]);
                    var y = d3.scale.linear().range([height - margin.bottom - marginAxis.bottom, margin.top + marginAxis.top + cursorTextHeight]);
                    var bisect = d3.bisector(function (d) { return d.time; }).left;

                    var line = d3.svg.line()
                        .interpolate("cardinal")
                        .x(function (d) { return x(d.time); })
                        .y(function (d) { return y(d.measurement); });

                    var data: { time: number; measurement: number }[] = []; 
                    for (var i = 0; i < scope.timestamps.length; i++) {
                        data.push({ time: scope.timestamps[i], measurement: scope.sensor[i] });
                    }
                    x.domain(d3.extent(data, function (d: { time: number; measurement: number }) { return d.time; }));
                    y.domain(d3.extent(data, function (d: { time: number; measurement: number }) { return d.measurement; }));

                    var path = chart.append("svg:path")
                        .attr("d", line(data))
                        .attr('class', 'sparkline-path');

                    // draw a circle around the max and min value
                    var measurements = data.map(function (d) { return d.measurement; });
                    var min = ChartHelpers.min(measurements);
                    var max = ChartHelpers.max(measurements);
                    chart.append('circle')
                        .attr('class', 'sparkcircle-max')
                        .attr('cx', x(data[max.maxIndex].time))
                        .attr('cy', y(max.max))
                        .attr('r', 4);
                    chart.append('circle')
                        .attr('class', 'sparkcircle-min')
                        .attr('cx', x(data[min.minIndex].time))
                        .attr('cy', y(min.min))
                        .attr('r', 4);

                    if (showAxis) {
                        //var xAxis = d3.svg.axis()
                        //    .scale(x)
                        //    .orient("bottom")
                        //    .ticks(d3.time.months, 2);  //Set rough # of ticks
                        //chart.append("g")
                        //    .attr("class", "sparkline-axis")
                        //    .attr("transform", "translate(0," + (height - margin.bottom - marginAxis.bottom) + ")")
                        //    .call(xAxis);
                        var strokeLength = 6;
                        // Draw min/max at x and y axis
                        var xbor = d3.min(x.range()), //margin.left + marginAxis.left,
                            xmin = xbor - strokeLength,
                            xmax = d3.max(x.range()), // width - margin.right - marginAxis.right,
                            ybor = d3.max(y.range()), //height - margin.bottom - marginAxis.bottom,
                            ymin = d3.min(y.range()), //margin.top + marginAxis.top,
                            ymax = ybor + strokeLength;

                        // y-axis, max
                        chart.append('line')
                            .attr("x1", xmin)
                            .attr("y1", ymin)
                            .attr("x2", xbor)
                            .attr("y2", ymin)
                            .attr("stroke", "black");
                        chart.append("text")
                            .attr("x", xmin - 2)
                            .attr("y", ymin)
                            .attr("dy", ".35em")
                            .style("text-anchor", "end")
                            .text(d3.max(y.domain()));
                        // y-axis, min
                        chart.append('line')
                            .attr("x1", xmin)
                            .attr("y1", ybor)
                            .attr("x2", xbor)
                            .attr("y2", ybor)
                            .attr("stroke", "black");
                        chart.append("text")
                            .attr("x", xmin - 2)
                            .attr("y", ybor)
                            .attr("dy", ".35em")
                            .style("text-anchor", "end")
                            .text(d3.min(y.domain()));
                        // x-axis, min
                        chart.append('line')
                            .attr("x1", xbor)
                            .attr("y1", ymax)
                            .attr("x2", xbor)
                            .attr("y2", ybor)
                            .attr("stroke", "black");
                        chart.append("text")
                            .attr("x", xbor)
                            .attr("y", ymax + 9)
                            .attr("dy", ".35em")
                            .style("text-anchor", "start")
                            .text(ChartHelpers.timestampToString(d3.min(x.domain())));
                        // x-axis, max
                        chart.append('line')
                            .attr("x1", xmax)
                            .attr("y1", ymax)
                            .attr("x2", xmax)
                            .attr("y2", ybor)
                            .attr("stroke", "black");
                        chart.append("text")
                            .attr("x", xmax)
                            .attr("y", ymax + 9)
                            .attr("dy", ".35em")
                            .style("text-anchor", "end")
                            .text(ChartHelpers.timestampToString(d3.max(x.domain())));
                    }

                    // draw a line at the current cursor position
                    var cursor = chart.append("line")
                        .attr("x1", 0)
                        .attr("y1", 0)
                        .attr("x2", 0)
                        .attr("y2", 0)
                        .attr("opacity", 0)
                        .attr("stroke", "black");
                    var timestampText = chart.append("text")
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("dy", ".35em")
                        .attr("opacity", 0)
                        .style("text-anchor", "end")
                        .text("");
                    var measurementText = chart.append("text")
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("dy", ".35em")
                        .attr("opacity", 0)
                        .text("");

                    var pathEl:any = path.node();
                    var pathLength = pathEl.getTotalLength();

                    chart
                        //.on("mouseover", function () { })
                        .on("mouseout", function () {
                            cursor.attr("opacity", 0);
                            timestampText.attr("opacity", 0);
                            measurementText.attr("opacity", 0);
                        })
                        .on("mousemove", function () {
                            var offsetLeft = element[0].getBoundingClientRect().left;
                            var xpos = d3.event.clientX - offsetLeft;
                            var beginning = xpos, end = pathLength, target;
                            while (true) {
                                target = Math.floor((beginning + end) / 2);
                                var pos = pathEl.getPointAtLength(target);
                                if ((target === end || target === beginning) && pos.x !== xpos) {
                                    break;
                                }
                                if (pos.x > xpos) end = target;
                                else if (pos.x < xpos) beginning = target;
                                else break; //position found
                            }
                            // using the x scale, in this case a d3 time scale
                            // use the .invert() function to interpolate a date along the scale
                            // given the x-coordinates of the mouse
                            var t0 = x.invert(d3.mouse(this)[0]);

                            // using the interpolated date, find an index in the sorted data
                            // this would be the index suitable for insertion
                            var i = bisect(data, t0, 1);

                            if (0 < i && i < data.length) { 
                                // now that we know where in the data the interpolated date would "fit"
                                // between two values, pull them both back as temporaries
                                var d0 = data[i - 1];
                                var d1 = data[i];

                                // now, examine which of the two dates we are "closer" to
                                // to do this, compare the delta values
                                var d = t0 - d0.time > d1.time - t0 ? d1 : d0;
                            }
                            else if (i <= 0) d = data[0];
                            else d = data[data.length - 1];
                            xpos = x(d.time);

                            // draw
                            cursor
                                .attr("x1", xpos)
                                .attr("y1", 0)
                                .attr("x2", xpos)
                                .attr("y2", d3.max(y.range()) + (strokeLength || 0))
                                .attr("opacity", 1);
                            timestampText
                                .attr("x", xpos - 6)
                                .attr("y", 4)
                                .attr("dy", ".35em")
                                .attr("opacity", 1)
                                .text(ChartHelpers.timestampToString(d.time));
                            measurementText
                                .attr("x", xpos + 6)
                                .attr("y", 4)
                                .attr("dy", ".35em")
                                .attr("opacity", 1)
                                .text(d.measurement);
                             });
                }
            }
        }])

        /**
        * A simple directive to create a (horizontal) barchart.
        * Usage: <bar-chart data="[10,20,30,40,50]"></bar-chart>
        * @seealso: https://gist.github.com/odiseo42/6731571
        */
        .directive('barChart', ['$filter',
            function ($filter): ng.IDirective {
                return {
                    terminal: true,       // do not compile any other internal directives 
                    restrict: 'EA',       // E = elements, other options are A=attributes and C=classes
                    scope: {
                        data: '=',
                    },
                    link: function (scope: IBarchartScope, element, attrs) {
                        //in D3, any selection[0] contains the group
                        //selection[0][0] is the DOM node
                        //but we won't need that this time
                        var chart = d3.select(element[0]);
                        //to our original directive markup bars-chart
                        //we add a div with out chart stling and bind each
                        //data entry to the chart
                        chart.append("div").attr("class", "chart")
                            .selectAll('div')
                            .data(scope.data).enter().append("div")
                            .transition().ease("elastic")
                            .style("width", function (d) { return d + "%"; })
                            .text(function (d) { return d + "%"; });
                        //a little of magic: setting it's width based
                        //on the data value (d) 
                        //and text all with a smooth transition
                    } 
                }
            }
        ]);
}
  