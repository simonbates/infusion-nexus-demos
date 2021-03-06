(function () {
    "use strict";

    var gpii = fluid.registerNamespace("gpii");
    var d3 = fluid.registerNamespace("d3");

    fluid.defaults("gpii.nexusSensorVisualizer.realTimeScale", {
        gradeNames: ["gpii.nexusSensorVisualizerBase"],
        components: {
            visualizer: {
                type: "gpii.nexusSensorVisualizer.realTimeScale.visualizer",
                options: {
                    scaleOptions: {
                        min: "{realTimeScale}.sensor.model.sensorMin",
                        max: "{realTimeScale}.sensor.model.sensorMax"
                    },
                    indicatorOptions: {
                        startingValue: "{realTimeScale}.sensor.model.sensorValue"
                    }
                }
            }
        }
    });

    fluid.defaults("gpii.nexusSensorVisualizer.realTimeScale.visualizer", {
        gradeNames: ["gpii.nexusVisualizerBase"],
        model: {
            svgTitle: "An animated real-time scale.",
            svgDescription: "An animated real-time scale."
        },
        svgOptions: {
            height: 500,
            width: 250
        },
        selectors: {
            "sensorValueIndicator": ".nexusc-sensorValueIndicator"
        },
        scaleOptions: {
            // All-around padding when creating the scale
            padding: 20,
            min: 0,
            max: 100,
            leftPadding: 75
        },
        indicatorOptions: {
            startingValue: 7
        },
        invokers: {
            "createVisualizer": {
                funcName: "gpii.nexusSensorVisualizer.realTimeScale.visualizer.createRealTimeVisualizer",
                args: ["{that}"]
            },
            "updateVisualizer": {
                funcName: "gpii.nexusSensorVisualizer.realTimeScale.visualizer.updateVisualization"
            }
        }
    });

    gpii.nexusSensorVisualizer.realTimeScale.visualizer.createSensorValueIndicator = function (that) {
        var h = that.options.svgOptions.height,
            w = that.options.svgOptions.width,
            padding = that.options.scaleOptions.padding,
            leftPadding = that.options.scaleOptions.leftPadding,
            startingValue = that.options.indicatorOptions.startingValue,
            svg = that.svg;

        that.sensorValueIndicator =
        svg.append("rect")
           .attr({
              "class": "nexusc-sensorValueIndicator",
              "x": leftPadding,
              "width": w - (leftPadding+padding*2),
              "y": function() {
                return that.yScale(startingValue);
              },
              "height": function() {
                  return (h-padding) - that.yScale(startingValue);
              },
              "fill": "orange",
              "stroke": "black"
          });
    };

    gpii.nexusSensorVisualizer.realTimeScale.visualizer.createRealTimeVisualizer = function (that) {

        var h = that.options.svgOptions.height,
            padding = that.options.scaleOptions.padding,
            scaleMin = that.options.scaleOptions.min,
            scaleMax = that.options.scaleOptions.max;

        that.yScale = d3.scale
               .linear()
               .domain([scaleMin, scaleMax])
               .range([h - padding, 0 + padding]);

    gpii.nexusSensorVisualizer.realTimeScale.visualizer.createYAxis(that);
    gpii.nexusSensorVisualizer.realTimeScale.visualizer.createSensorValueIndicator(that);
 };

 gpii.nexusSensorVisualizer.realTimeScale.visualizer.createYAxis = function (that) {
     var leftPadding = that.options.scaleOptions.leftPadding;

     var yAxis = d3.svg.axis().scale(that.yScale).orient("left").innerTickSize(25);
     that.svg.append("g")
        .call(yAxis)
        .attr("transform", "translate(" + leftPadding + ")");
 };

    gpii.nexusSensorVisualizer.realTimeScale.visualizer.updateVisualization = function (visualizer, change) {

        var h = visualizer.options.svgOptions.height,
            padding = visualizer.options.scaleOptions.padding;

            var transitionDuration = visualizer.options.visualizerOptions.transitionDuration;

            visualizer.sensorValueIndicator
            .transition()
            .duration(transitionDuration)
            .attr({
                "height": function() {
                    return (h-padding) - visualizer.yScale(change.value);
                },
                "y": function() {
                  return visualizer.yScale(change.value);
                }
                })
            .each("end", function() {
                visualizer.events.onUpdateCompleted.fire();
            });

    };

}());
