/// <reference path="../reference.ts" />


// Has the following responsibilities: 
// - Draw the image 
// - Draw the annotations. The annotation draw loop
// - Have a list of tools 
// - Pass the 
// -    on mouse down
// -    on mouse move
// -    on mouse up 
class AnnotationDisplayManager {

    stage: createjs.Stage;
    image: createjs.Bitmap;

    drawingCanvas: createjs.Shape;
    color = 'white'; // The annotation color by default

    imageModel: UIAnnotateImage;



    redraw() {
        if (!this.imageModel) return;

        // Draw points 
        if (this.imageModel.annotations.length) {
            _.forEach(this.imageModel.annotations, (pointAnnotation) => {
                if (pointAnnotation.points.length == 0) return;

                var oldPt = pointAnnotation.points[0];
                var oldMidPt = oldPt.clone();

                this.drawingCanvas.graphics.beginStroke(this.color);

                _.forEach(pointAnnotation.points, (newPoint) => {
                    var midPt = new createjs.Point((oldPt.x + newPoint.x) / 2, (oldPt.y + newPoint.y) / 2);

                    this.drawingCanvas.graphics.moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);

                    oldPt = newPoint.clone();
                    oldMidPt = midPt.clone();
                });

                this.drawingCanvas.graphics.endStroke();
            });
        }

        // Render it out
        this.stage.update();
    }
}