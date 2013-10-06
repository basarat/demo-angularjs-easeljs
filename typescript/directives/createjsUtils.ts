/// <reference path="../reference.ts" />

module ToolType {
    export var brush = "brush";
    export var rectangle = "rectangle";
}

module annotationsModule {

    export var annotationSetting = {
        color: 'white',
        shadow: '#000000',
        lineWidth: 4,

        circleRadius: 15,
        circleColor: '#00b8f1', // picme blue 
        circleBorderColor: '#FFFFFF',
        circleBorderRadius: 3,
        circleFontFamily: 'Arial Bold',
        circleFontSize: 20,
        circleFontYDisplacement: 12, // Depends on the visual properties of the font family
        circleFontColor: 'white',
    }


    // Returns a scaled value of the point based on the image dimensions
    export function createJSPoint_to_pixel(point: createjs.Point): Point {
        var x = (point.x);
        var y = (point.y);
        return {
            x: x,
            y: y
        };
    }

    export function pixel_to_createJSPoint(point: Point): createjs.Point {
        var x = (point.x);
        var y = (point.y);
        return new createjs.Point(x, y);
    }
}