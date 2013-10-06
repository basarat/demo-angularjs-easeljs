/// <reference path="../reference.ts" />


class RectangleTool implements AnnotationTool {

    constructor(public drawingCanvas: createjs.Shape, public liveDrawingCanvas: createjs.Shape) { }

    renderDrawing(drawing: AnnotationDrawing) {
        if (!drawing.rectangle) return;

        this.drawingCanvas.graphics.drawRect(drawing.rectangle.x, drawing.rectangle.y, drawing.rectangle.width, drawing.rectangle.height);        
    }

    startPoint: createjs.Point;
    endPoint: createjs.Point;

    handleMouseDown(pixelx: number, pixely: number) {
        this.startPoint = new createjs.Point(pixelx, pixely);
        this.endPoint = null;
    }

    handleMouseMove(pixelx: number, pixely: number) {

        this.endPoint = new createjs.Point(pixelx, pixely);

        this.liveDrawingCanvas.graphics.beginStroke(annotationsModule.annotationSetting.color);
        this.liveDrawingCanvas.graphics.drawRect(this.startPoint.x, this.startPoint.y, this.endPoint.x - this.startPoint.x, this.endPoint.y - this.startPoint.y);
        this.liveDrawingCanvas.graphics.endStroke();
    }

    // Should return the created annotation drawing 
    handleMouseUp(): AnnotationDrawing {
        if (!this.endPoint) {
            return null;
        }

        // find the min of start or end point 
        var xMin = Math.min(this.startPoint.x, this.endPoint.x);
        var xMax = Math.max(this.startPoint.x, this.endPoint.x);

        var yMin = Math.min(this.startPoint.y, this.endPoint.y);
        var yMax = Math.max(this.startPoint.y, this.endPoint.y);

        var currentPointAnnotation: AnnotationDrawing = {
            type: ToolType.rectangle,
            numberLocation: { x: xMin, y: yMin },
            rectangle: { x: xMin, y: yMin, width: xMax - xMin, height: yMax - yMin }
        };
        
        return currentPointAnnotation;
    }
}