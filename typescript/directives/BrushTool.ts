/// <reference path="../reference.ts" />


class BrushTool implements AnnotationTool {

    constructor(public drawingCanvas: createjs.Graphics, public liveDrawingCanvas: createjs.Graphics) { }

    renderDrawing(drawing: AnnotationDrawing) {
        // Draw points 
        if (drawing.points.length == 0) return;

        var oldPt = annotationsModule.pixel_to_createJSPoint(drawing.points[0]);
        var oldMidPt = oldPt.clone();

        _.forEach(drawing.points, (pixelPoint) => {
            var newPoint = annotationsModule.pixel_to_createJSPoint(pixelPoint);
            var midPt = new createjs.Point((oldPt.x + newPoint.x) / 2, (oldPt.y + newPoint.y) / 2);

            this.drawingCanvas.moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);

            oldPt = newPoint.clone();
            oldMidPt = midPt.clone();
        });
    }

    currentPointAnnotation: AnnotationDrawing;
    oldPt;
    oldMidPt;

    handleMouseDown(pixelx: number, pixely: number) {

        this.oldPt = new createjs.Point(pixelx, pixely);
        this.oldMidPt = this.oldPt;

        this.currentPointAnnotation = {
            type: ToolType.brush,
            numberLocation: null,
            points: [annotationsModule.createJSPoint_to_pixel(this.oldPt)]
        };

        this.liveDrawingCanvas.beginStroke(annotationsModule.annotationSetting.color);
    }

    handleMouseMove(pixelx: number, pixely: number) {

        var newPoint = new createjs.Point(pixelx, pixely);
        var midPt = new createjs.Point((this.oldPt.x + newPoint.x) / 2, (this.oldPt.y + newPoint.y) / 2);

        this.liveDrawingCanvas.moveTo(midPt.x, midPt.y).curveTo(this.oldPt.x, this.oldPt.y, this.oldMidPt.x, this.oldMidPt.y);


        this.oldPt = newPoint.clone();

        this.oldMidPt.x = midPt.x;
        this.oldMidPt.y = midPt.y;

        // Store 
        var pixelpoint = annotationsModule.createJSPoint_to_pixel(this.oldPt);
        this.currentPointAnnotation.points.push(pixelpoint);
    }

    // Should return the created annotation drawing 
    handleMouseUp(): AnnotationDrawing {
        // Calculate the number location: 
        // Find the min x and min y: 
        var minx: number = _.min(this.currentPointAnnotation.points, (point) => point.x).x;
        var miny: number = _.min(this.currentPointAnnotation.points, (point) => point.y).y;
        this.currentPointAnnotation.numberLocation = new createjs.Point(minx, miny);

        return this.currentPointAnnotation;
    }
}