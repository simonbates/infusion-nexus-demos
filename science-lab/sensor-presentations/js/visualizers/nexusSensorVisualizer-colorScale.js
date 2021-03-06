(function () {
    "use strict";

    var gpii = fluid.registerNamespace("gpii");
    var d3 = fluid.registerNamespace("d3");

    fluid.defaults("gpii.nexusSensorVisualizer.colorScale", {
        gradeNames: ["gpii.nexusSensorVisualizerBase"],
        components: {
            visualizer: {
                type: "gpii.nexusSensorVisualizer.colorScale.visualizer",
                options: {
                    scaleOptions: {
                        min: "{colorScale}.sensor.model.sensorMin",
                        max: "{colorScale}.sensor.model.sensorMax"
                    },
                    indicatorOptions: {
                        startingValue: "{colorScale}.sensor.model.sensorValue"
                    }
                }
            }
        }
    });

    // A generic color scale with an indicator, y-axis and labels
    fluid.defaults("gpii.nexusSensorVisualizer.colorScale.visualizer", {
        gradeNames: ["gpii.nexusVisualizerBase", "floe.svgDrawingArea"],
        model: {
            svgTitle: "An animated scale.",
            svgDescription: "An animated scale."
        },
        selectors: {
            sensorValueIndicator: ".nexusc-indicator",
            colorBars: ".nexusc-colorScale-colorBar",
            colorBarLabels: ".nexusc-colorScale-colorBarLabels",
            positionedText: ".nexusc-colorScale-positionedText"
        },
        scaleOptions: {
            min: 0,
            max: 100,
            // Define gradients for use in the color scale
            // For now, they use the SVG gradient syntax
            // described at https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Gradients
            gradientMarkup: {
                // Gradient1: "<linearGradient id=\"Gradient1\" x1=\"0\" x2=\"0\" y1=\"0\" y2=\"1\"> <stop offset=\"0%\" stop-color=\"red\"/> <stop offset=\"50%\" stop-color=\"black\" stop-opacity=\"0\"/> <stop offset=\"100%\" stop-color=\"blue\"/> </linearGradient>"
            },
            colors: [],
            // colors: ["#FF0000","#00FF00", "#0000FF"]
            textOptions: {
                // Creates labels for each point of the scale
                labels: {
                    template: "%bandStart – %bandEnd",
                    // Scales the font size relative to the
                    // bar height - this may need tweaking
                    // dependent on the number of bars and
                    // the length of the template
                    labelTextScalingToBarHeight: 0.25,
                    valueDecimalPlaces: 2
                }
                // Creates precisely positioned text relative to the scale
                // positionedText: {
                //     0: "0",
                //     50: "50",
                //     100: "100"
                // }
            },
            // All-around padding when creating the scale
            padding: 20,
            leftPadding: 75
        },
        indicatorOptions: {
            startingValue: 50
        },
        invokers: {
            getIndicatorColor: {
                funcName: "gpii.nexusSensorVisualizer.colorScale.visualizer.getIndicatorColor",
                args: ["{that}", "{arguments}.0"]
            },
            createVisualizer: {
                funcName: "gpii.nexusSensorVisualizer.colorScale.visualizer.createVisualizer",
                args: ["{that}"]
            },
            updateVisualizer: {
                funcName: "gpii.nexusSensorVisualizer.colorScale.visualizer.updateVisualization"
            }
        },
        listeners: {
            "onCreate.prependSensorTitle": {
                "this": "{that}.container",
                method: "prepend",
                args: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["<h2>%description</h2>", "{sensor}.model"]
                    }
                }
            }
        }
    });

    gpii.nexusSensorVisualizer.colorScale.visualizer.createYScale = function (that) {

        var h = that.options.svgOptions.height,
            padding = that.options.scaleOptions.padding,
            scaleMin = that.options.scaleOptions.min,
            scaleMax = that.options.scaleOptions.max;

        that.yScale = d3.scale
               .linear()
               .domain([scaleMin,scaleMax])
               .range([h - padding, 0 + padding]);
    };

    gpii.nexusSensorVisualizer.colorScale.visualizer.createColorScale = function (that) {
        var h = that.options.svgOptions.height,
            w = that.options.svgOptions.width,
            padding = that.options.scaleOptions.padding,
            leftPadding = that.options.scaleOptions.leftPadding,
            colors = that.options.scaleOptions.colors,
            scaleMin = that.options.scaleOptions.min,
            scaleMax = that.options.scaleOptions.max,
            svg = that.svg;

        var colorScaleLength = colors.length;

        // Ordinal scale used for positioning color bands
        that.colorToPositionScale = d3.scale.ordinal()
        .domain(colors)
        .rangeBands([h - padding, 0 + padding]);

        // Quantize scale used for converting a scaled
        // value into a color
        that.valueToColorScale = d3.scale.quantize()
        .domain([scaleMin, scaleMax])
        .range(colors);

        var colorToPositionScale = that.colorToPositionScale;

        that.barNumberToScaleRatio = scaleMax / colorScaleLength;

        that.barHeight = ((h - padding) / (colorScaleLength));

        var barHeight = that.barHeight;

        fluid.each(colors, function(color) {
            svg.append("rect")
               .attr({
                  "class": "nexusc-colorScale-colorBar",
                  "x": leftPadding,
                  "y": function() {
                    return colorToPositionScale(color);
                  },
                  "width": w - leftPadding,
                  "height": barHeight,
                  "fill": color,
                  "stroke": "#FCC"
              });
        });

    };

    gpii.nexusSensorVisualizer.colorScale.visualizer.createColorScaleLabels = function (that) {

        var colors = that.options.scaleOptions.colors,
            textOptions = that.options.scaleOptions.textOptions,
            leftPadding = that.options.scaleOptions.leftPadding,
            scaleMin = that.options.scaleOptions.min,
            scaleMax = that.options.scaleOptions.max,
            w = that.options.svgOptions.width,
            svg = that.svg,
            barHeight = that.barHeight,
            labelTextScalingToBarHeight =  that.options.scaleOptions.textOptions.labels.labelTextScalingToBarHeight;

        var colorToPositionScale = that.colorToPositionScale;

        // Helps figure out which label should go with which color
        var colorLabelScale = d3.scale.ordinal()
        .domain(colors)
        .rangeBands([scaleMin, scaleMax]);

        // Get an array with the range values, plus the max, for use in labeling
        var colorLabelScaleRange = colorLabelScale.range();
        colorLabelScaleRange.push(scaleMax);

        fluid.each(colors, function(color, index) {
            svg.append("text")
              .text(gpii.nexusSensorVisualizer.colorScale.visualizer.getColorScaleLabelText(index, textOptions, colorLabelScaleRange))
              .attr({
                "class": "nexusc-colorScale-colorBarLabels",
                "text-anchor": "middle",
                "transform": "translate(" + leftPadding + ")",
                "fill": "white",
                "x": (w - leftPadding) / 2,
                "y": function() {
                  return colorToPositionScale(color) + barHeight / 2;
                },
                "font-size": barHeight * labelTextScalingToBarHeight
            });
        });
    };

    gpii.nexusSensorVisualizer.colorScale.visualizer.getColorScaleLabelText = function (index, textOptions, colorLabelScaleRange) {

        var template = textOptions.labels.template,
            valueDecimalPlaces = textOptions.labels.valueDecimalPlaces;

        // What is the starting value of this color band to the scale
        var bandStart = colorLabelScaleRange[index].toFixed(valueDecimalPlaces);

        // What is the ending value of this color band to the scale
        var bandEnd = colorLabelScaleRange[index+1].toFixed(valueDecimalPlaces);

        var templateValues = {
            bandStart: bandStart,
            bandEnd: bandEnd
        };

        return fluid.stringTemplate(template, templateValues);
    };


    gpii.nexusSensorVisualizer.colorScale.visualizer.createPositionedText = function (that) {
        var positionedTextValues = that.options.scaleOptions.textOptions.positionedText,
            leftPadding = that.options.scaleOptions.leftPadding,
            w = that.options.svgOptions.width,
            svg = that.svg;

            // Background filter for text
            var filter =
            svg.append("defs")
            .append("filter")
            .attr({
                "x": 0,
                "y": 0,
                "width": 1,
                "height": 1,
                "id": "solid"
            });

            filter.append("feFlood")
            .attr({
                "flood-color": "black"
            });

            filter.append("feComposite")
            .attr("in", "SourceGraphic");


        fluid.each(positionedTextValues, function (text, key) {
            svg.append("text")
            .text(text)
            .attr({
                "text-anchor": "end",
                "class": "nexusc-colorScale-positionedText",
                "transform": "translate(" + leftPadding + ")",
                "fill": "white",
                "filter": "url(#solid)",
                "x": w - (leftPadding+5),
                "y": function() {
                  return that.yScale(key);
                },
                // Keeps these at an even size
                "font-size": that.barHeight / 3,
                "dominant-baseline": "central"
            });
        });
    };

    gpii.nexusSensorVisualizer.colorScale.visualizer.createIndicator = function (that) {
        // Draw the PH indicator

        var svg = that.svg;

        var startingValue = that.options.indicatorOptions.startingValue;

        // Where the point of the arrow should be aligned
        var pointLocation = that.yScale(startingValue) - 15;

        that.indicator =
        svg.append("path")
        .attr({
            "class" : "nexusc-indicator",
            "transform": "translate(40,"+ pointLocation +")",
            "fill": function() {
                return that.getIndicatorColor(startingValue);
            },
            "d": "M20 20 h-40 v-10 h40 v-10 l15 15 l-15 15 v-10",
            "stroke": "black"
        });
    };

    gpii.nexusSensorVisualizer.colorScale.visualizer.createGradients = function (that) {
        var gradientMarkup = that.options.scaleOptions.gradientMarkup;
        fluid.each(gradientMarkup, function(gradient) {
            var defs = that.svg.append("defs");
            defs.html(gradient);
        });
    };

    gpii.nexusSensorVisualizer.colorScale.visualizer.createVisualizer = function (that) {

        var h = that.options.svgOptions.height,
            padding = that.options.scaleOptions.padding,
            colors = that.options.scaleOptions.colors;

        var colorScaleLength = colors.length;

    that.barHeight = (h - padding) / colorScaleLength;

    gpii.nexusSensorVisualizer.colorScale.visualizer.createYScale(that);

    gpii.nexusSensorVisualizer.colorScale.visualizer.createGradients(that);

    gpii.nexusSensorVisualizer.colorScale.visualizer.createYAxis(that);

    gpii.nexusSensorVisualizer.colorScale.visualizer.createColorScale(that);

    gpii.nexusSensorVisualizer.colorScale.visualizer.createColorScaleLabels(that);

    gpii.nexusSensorVisualizer.colorScale.visualizer.createPositionedText(that);

    gpii.nexusSensorVisualizer.colorScale.visualizer.createIndicator(that);
 };

    gpii.nexusSensorVisualizer.colorScale.visualizer.updateVisualization = function (that, change) {
            var newIndicatorLocation = that.yScale(change.value) - 15;
            var newIndicatorColor = that.getIndicatorColor(change.value);
            var transitionDuration = that.options.visualizerOptions.transitionDuration;

            that.indicator
            .transition()
            .duration(transitionDuration)
            .attr({
                "transform": "translate(40,"+ newIndicatorLocation +")",
                "fill": newIndicatorColor
            })
            .each("end", function() {
                that.events.onUpdateCompleted.fire();
            });
    };

    gpii.nexusSensorVisualizer.colorScale.visualizer.getIndicatorColor = function (that, indicatorValue) {
        var valueToColorScale = that.valueToColorScale;
        return valueToColorScale(indicatorValue);
    };

    gpii.nexusSensorVisualizer.colorScale.visualizer.createYAxis = function (that) {
        var leftPadding = that.options.scaleOptions.leftPadding;

        var yAxis = d3.svg.axis().scale(that.yScale).orient("left").innerTickSize(25);
        that.svg.append("g")
           .call(yAxis)
           .attr("transform", "translate(" + leftPadding + ")");
    };
}());
