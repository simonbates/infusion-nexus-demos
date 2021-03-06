(function () {
    "use strict";

    var gpii = fluid.registerNamespace("gpii");

    // Sonification presentation panel
    fluid.defaults("gpii.nexusSensorVisualizationPanel", {
        gradeNames: ["gpii.nexusSensorPresentationPanel"],
        // Key-value pairs of sensorIds / sensorPresenter grades
        perSensorPresentationGrades: {
            "fakeSensorPH": "gpii.nexusSensorVisualizer.pHScale",
            "fakeSensorTemperature": "gpii.nexusSensorVisualizer.temperature",
            "rpiTempSensor1": "gpii.nexusSensorVisualizer.temperature",
            "rpiTempSensor2": "gpii.nexusSensorVisualizer.temperature",
            "phSensor": "gpii.nexusSensorVisualizer.pHScale"
        },
        dynamicComponentContainerOptions: {
            // fluid.stringTemplate
            containerIndividualClassTemplate: "nexus-nexusSensorSonificationPanel-sensorDisplay-%sensorId"
        },
        defaultSensorPresentationGrade: "gpii.nexusSensorVisualizer.realTimeScale",
        invokers: {
            "generatePresenterOptionsBlock": {
                funcName: "gpii.nexusSensorVisualizationPanel.getSensorPresenterOptionsBlock",
                args: ["{arguments}.0", "{arguments}.1", "{arguments}.2"]
            }
        }
    });

    gpii.nexusSensorVisualizationPanel.getSensorPresenterOptions = function (sensorId, sensorName, sensorPresentationPanel) {

        var sensorPresenterModelOptions = gpii.nexusSensorPresentationPanel.getSensorModelOptions(sensorId);

        var sensorPresenterContainerClass = fluid.stringTemplate(sensorPresentationPanel.options.dynamicComponentContainerOptions.containerIndividualClassTemplate, {sensorId: sensorId});

        var sensorPresenterListenerOptions = gpii.nexusSensorPresentationPanel.getSensorPresenterListenerOptions(sensorId, sensorPresenterContainerClass, sensorName);

        return sensorPresentationPanel.generatePresenterOptionsBlock(sensorPresenterModelOptions, sensorPresenterListenerOptions, sensorPresenterContainerClass);
    };

    gpii.nexusSensorVisualizationPanel.getSensorPresenterOptionsBlock = function (sensorPresenterModelOptions, sensorPresenterListenerOptions, sensorPresenterContainerClass) {
        var optionsBlock = {
                events: {
                    onSensorDisplayContainerAppended: null
                },
                listeners: sensorPresenterListenerOptions,
                components: {
                    sensor: {
                        options: {
                            model: sensorPresenterModelOptions
                        }
                    },
                    visualizer: {
                        container: "." + sensorPresenterContainerClass
                    }
                }
        };

        return optionsBlock;
    };

    // Abstract grade used by sensor visualizer
    fluid.defaults("gpii.nexusSensorVisualizerBase", {
        gradeNames: ["fluid.component"],
        events: {
            onSensorDisplayContainerAppended: null
        },
        components: {
            sensor: {
                type: "fluid.modelComponent"
            },
            visualizer: {
                options: {
                    modelListeners: {
                        "{nexusSensorVisualizerBase}.sensor.model.sensorValue": {
                            funcName: "{that}.updateVisualizer",
                            args: ["{that}", "{change}"]
                        }
                    }
                },
                createOnEvent: "{nexusSensorVisualizerBase}.events.onSensorDisplayContainerAppended"
                // Must be specified; handled by dynamicComponents behaviour
                // container: ""
            }
        }
    });

    fluid.defaults("gpii.nexusVisualizerBase", {
        gradeNames: ["floe.svgDrawingArea"],
        events: {
            onUpdateCompleted: null
        },
        invokers: {
            "createVisualizer": {
                funcName: "fluid.notImplemented"
            },
            "updateVisualizer": {
                funcName: "fluid.notImplemented"
            }
        },
        visualizerOptions: {
            // In milliseconds
            transitionDuration: 1000
        },
        model: {
            svgTitle: "A sensor visualizer.",
            svgDescription: "A sensor visualizer."
        },
        strings: {
            sensorTitleTemplate: "<h2>%description</h2>"
        },
        listeners: {
            "onCreate.prependSensorTitle": {
                "this": "{that}.container",
                method: "prepend",
                args: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["{that}.options.strings.sensorTitleTemplate", "{sensor}.model"]
                    }
                }
            },
            "onCreate.createBaseSVGDrawingArea": {
                func: "{that}.createBaseSVGDrawingArea"
            },
            "onCreate.createVisualizer": {
                funcName: "{that}.createVisualizer",
                priority: "after:createBaseSVGDrawingArea"
            }
        }
    });

}());
