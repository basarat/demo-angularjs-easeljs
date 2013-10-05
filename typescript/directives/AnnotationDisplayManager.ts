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


interface UIAnnotateImage {
    width: number;
    height: number;
    uri: string;
    annotations: Annotation[];
    unsavedAnnotation?: Annotation;
}

interface Annotation {
    index: number;
    drawings: AnnotationDrawing[];
}

interface AnnotationDrawing {
    //type: string;
    points?: createjs.Point[]; // valid for brushes
}

interface Point {
    x: number;
    y: number;
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
    image: createjs.Bitmap; // The bottom image DisplayObject
    queue: createjs.LoadQueue;

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

        // Create a drawing canvas for saved drawings
        this.drawingCanvas = new createjs.Shape();
        this.drawingCanvas.shadow = new createjs.Shadow("#000000", 5, 5, 10);
        this.stage.addChild(this.drawingCanvas);

        // Stage behaviours 
        this.stage.autoClear = true;
        this.stage.enableDOMEvents(true);

        // Setup event listener
        this.stage.addEventListener("stagemousedown", this.handleMouseDown);

        // Setup the load queue
        this.queue = new createjs.LoadQueue(false); // Using false to disble XHR only for file system based demo
    }

    private renderDrawing(drawing: AnnotationDrawing) {
        // Draw points 
        if (drawing.points.length == 0) return;

        var oldPt = drawing.points[0];
        var oldMidPt = oldPt.clone();

        this.drawingCanvas.graphics.beginStroke(this.color);

        _.forEach(drawing.points, (newPoint) => {
            var midPt = new createjs.Point((oldPt.x + newPoint.x) / 2, (oldPt.y + newPoint.y) / 2);

            this.drawingCanvas.graphics.moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);

            oldPt = newPoint.clone();
            oldMidPt = midPt.clone();
        });

        this.drawingCanvas.graphics.endStroke();
    }

    redraw() {
        if (!this.imageModel) return;

        _.forEach(this.imageModel.annotations, (annotation) => {
            _.forEach(annotation.drawings, (drawing) => {
                this.renderDrawing(drawing);
            });
        });

        _.forEach(this.imageModel.unsavedAnnotation.drawings, (drawing) => {
            this.renderDrawing(drawing);
        });

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

        // Find the best fit for the image
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

        // Initialize the unsavedAnnotations
        this.imageModel.unsavedAnnotation = { index: 1, drawings: [] };

        // Get , add , draw the image
        var onComplete = () => {

            // If there is already an image remove it
            if (this.image)
                this.stage.removeChildAt(0);

            this.image = new createjs.Bitmap(this.queue.getResult("myImage"));
            this.stage.addChildAt(this.image, 0);
            this.stage.update();

            this.resize(this.canvaswidth, this.canvasheight);
        }

        // Load the image async
        this.queue.addEventListener("complete", onComplete);
        this.queue.loadManifest([
            { id: "myImage", src: imageModel.uri }
        ]);
    }

    currentPointAnnotation: AnnotationDrawing;
    oldPt;
    oldMidPt;

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

        this.imageModel.unsavedAnnotation.drawings.push(this.currentPointAnnotation);

        this.drawingCanvas.graphics.endStroke();
    }
}