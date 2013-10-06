/// <reference path="../reference.ts" />


class RectangleTool implements AnnotationTool {

    constructor(public drawingCanvas: createjs.Shape, public context: CanvasRenderingContext2D) { }

    renderDrawing(drawing: AnnotationDrawing) {
        if (!drawing.rectangle) return;

        this.drawingCanvas.graphics.beginStroke(annotationsModule.annotationSetting.color);
        this.drawingCanvas.graphics.drawRect(drawing.rectangle.x, drawing.rectangle.y, drawing.rectangle.width, drawing.rectangle.height);
        this.drawingCanvas.graphics.endStroke();
    }

    startPoint: createjs.Point;
    endPoint: createjs.Point;

    handleMouseDown(pixelx: number, pixely: number) {
        this.startPoint = new createjs.Point(pixelx, pixely);
        this.endPoint = null;
    }

    handleMouseMove(pixelx: number, pixely: number) {

        this.endPoint = new createjs.Point(pixelx, pixely);

        this.drawingCanvas.graphics.clear();
        this.drawingCanvas.graphics.beginStroke(annotationsModule.annotationSetting.color);
        this.drawingCanvas.graphics.drawRect(this.startPoint.x, this.startPoint.y, this.endPoint.x - this.startPoint.x, this.endPoint.y - this.startPoint.y);
        this.drawingCanvas.graphics.endStroke();
    }

    // Should return the created annotation drawing 
    handleMouseUp(): AnnotationDrawing {
        if (!this.endPoint) {
            return null;
        }

        // find the min of start or end point 
        var minX = Math.min(this.startPoint.x, this.endPoint.x);
        var maxX = Math.max(this.startPoint.x, this.endPoint.x);

        var minY = Math.min(this.startPoint.y, this.endPoint.y);
        var maxY = Math.max(this.startPoint.y, this.endPoint.y);

        var currentPointAnnotation: AnnotationDrawing = {
            type: ToolType.rectangle,
            numberLocation: { x: minX, y: minY },
            rectangle: { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
        };

        currentPointAnnotation.numberLocation = this.startPoint.clone();
        return currentPointAnnotation;
    }
}