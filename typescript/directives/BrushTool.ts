/// <reference path="../reference.ts" />


class BrushTool {

    active: boolean; // Is this tool active 

    constructor(public drawingCanvas: createjs.Shape) { }

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

    OnMouseDown() { }
    OnMouseMove() { }
    OnMouseUp() { }

}