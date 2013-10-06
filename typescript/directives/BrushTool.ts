/// <reference path="../reference.ts" />


class BrushTool {

    active: boolean; // Is this tool active 

    constructor(public drawingCanvas: createjs.Shape,public annotationSetting) { }

    renderDrawing(drawing: AnnotationDrawing) {
        // Draw points 
        if (drawing.points.length == 0) return;

        var oldPt = createjsUtils.pixel_to_createJSPoint(drawing.points[0]);
        var oldMidPt = oldPt.clone();

        _.forEach(drawing.points, (pixelPoint) => {
            var newPoint = createjsUtils.pixel_to_createJSPoint(pixelPoint);
            var midPt = new createjs.Point((oldPt.x + newPoint.x) / 2, (oldPt.y + newPoint.y) / 2);

            this.drawingCanvas.graphics.moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);

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
            points: [createjsUtils.createJSPoint_to_pixel(this.oldPt)]
        };

        this.drawingCanvas.graphics.beginStroke(this.annotationSetting.color);
    }

    handleMouseMove(pixelx: number, pixely: number) {

        var newPoint = new createjs.Point(pixelx, pixely);
        var midPt = new createjs.Point((this.oldPt.x + newPoint.x) / 2, (this.oldPt.y + newPoint.y) / 2);

        this.drawingCanvas.graphics.moveTo(midPt.x, midPt.y).curveTo(this.oldPt.x, this.oldPt.y, this.oldMidPt.x, this.oldMidPt.y);


        this.oldPt = newPoint.clone();

        this.oldMidPt.x = midPt.x;
        this.oldMidPt.y = midPt.y;

        // Store 
        var pixelpoint = createjsUtils.createJSPoint_to_pixel(this.oldPt);
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