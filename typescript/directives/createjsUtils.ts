/// <reference path="../reference.ts" />

module ToolType {
    export var brush = "brush";
    export var rectangle = "rectangle";
}

module createjsUtils {

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