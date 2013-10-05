/// <reference path="../reference.ts" />

/*
* Given an object, binds its all prototype methods to the object.
* Use in controller's constructor like
*     Utils.bindProtoFunctions(this);
* , instead of _.bind and _.bindAll.
* Make sure that this is the first line in the constructor (when you want to use it). 
*/
function bindProtoFunctions(thisObj: any) {
    var args = [thisObj];
    var protos = thisObj.constructor.prototype;
    for (var attr in protos) {
        if (_.isFunction(protos[attr])) {
            //console.log(attr)
            args.push(attr);
        }
    }
    _.bindAll.apply(_, args);
}


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

    canvaswidth: number = 1;
    canvasheight: number = 1;

    minZoom: number; // The minimum zoom level we will allow for the internal createjs canvas

    constructor(public canvas: HTMLCanvasElement) {
        bindProtoFunctions(this);

        // Create the stage 
        this.stage = new createjs.Stage(canvas);
        createjs.Touch.enable(this.stage);

        // Create a drawing canvas for our rendering
        this.drawingCanvas = new createjs.Shape();
        this.drawingCanvas.shadow = new createjs.Shadow("#000000", 5, 5, 10);
        this.stage.addChild(this.drawingCanvas);

        // Stage behaviours 
        this.stage.autoClear = true;
        this.stage.enableDOMEvents(true);

        // Setup event listener
        this.stage.addEventListener("stagemousedown", this.handleMouseDown);
    }

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

    resize(width: number, height: number) {
        if (!width || !height) return;
        this.canvaswidth = width;
        this.canvasheight = height;

        // Set the canvas width / height 
        this.stage.canvas.width = width;
        this.stage.canvas.height = height;

        // Assumption. The width / height of container matches the proportion for image. 
        // This is done by parent already
        var widthZoom = width / this.imageModel.width;
        var heightZoom = height / this.imageModel.height;
        this.minZoom = Math.min(widthZoom, heightZoom);

        // Set the zoom so that image takes up entire canvas
        // This allows us to zoom the stage and everything stays in proportion when we do that
        this.stage.scaleX = this.minZoom;
        this.stage.scaleY = this.minZoom;

        // Set the stroke based on the scale: 
        this.drawingCanvas.graphics.clear().setStrokeStyle(7 * (1 / this.minZoom), 'round', 'round');

        // At the end of the resize we need to do a redraw
        this.redraw();
    }

    setImageModel(imageModel: UIAnnotateImage) {
        if (!imageModel) return;
        this.imageModel = imageModel;

        // TODO: actually remove everything.
        // We are not removing the drawing canvas right now
        if (this.image) {
            this.stage.removeChildAt(0);
        }

        var onComplete = () => {
            // Get , add , draw the image
            this.image = new createjs.Bitmap(queue.getResult("myImage"));
            this.stage.addChildAt(this.image, 0);
            this.stage.update();

            this.resize(this.canvaswidth, this.canvasheight);
        }

        // Load the image async
        var queue = new createjs.LoadQueue(false); // Using false to disble XHR only for file system based demo
        queue.addEventListener("complete", onComplete);
        queue.loadManifest([
            { id: "myImage", src: imageModel.uri }
        ]);
    }


    currentPointAnnotation: Annotation;
    oldPt;
    oldMidPt;
    title;
    index;

    handleMouseDown(event) {
        this.oldPt = new createjs.Point(this.stage.mouseX / this.stage.scaleX, this.stage.mouseY / this.stage.scaleY);
        this.oldMidPt = this.oldPt;

        this.stage.addEventListener("stagemousemove", this.handleMouseMove);
        this.stage.addEventListener("stagemouseup", this.handleMouseUp);

        this.currentPointAnnotation = {
            points: [this.oldPt.clone()]
        };

        this.drawingCanvas.graphics.beginStroke(this.color);
    }

    handleMouseMove(event) {

        // If it is outside the image ignore 
        if (!this.image.hitTest(this.stage.mouseX / this.stage.scaleX, this.stage.mouseY / this.stage.scaleY)) {
            return;
        }

        var newPoint = new createjs.Point(this.stage.mouseX / this.stage.scaleX, this.stage.mouseY / this.stage.scaleY);
        var midPt = new createjs.Point((this.oldPt.x + newPoint.x) / 2, (this.oldPt.y + newPoint.y) / 2);

        this.drawingCanvas.graphics.moveTo(midPt.x, midPt.y).curveTo(this.oldPt.x, this.oldPt.y, this.oldMidPt.x, this.oldMidPt.y);
        this.stage.update();

        this.oldPt = newPoint.clone();

        this.oldMidPt.x = midPt.x;
        this.oldMidPt.y = midPt.y;

        // Store 
        this.currentPointAnnotation.points.push(this.oldPt.clone());
    }

    handleMouseUp(event) {
        this.stage.removeEventListener("stagemousemove", this.handleMouseMove);
        this.stage.removeEventListener("stagemouseup", this.handleMouseUp);

        this.imageModel.annotations.push(this.currentPointAnnotation);

        this.drawingCanvas.graphics.endStroke();
    }
}