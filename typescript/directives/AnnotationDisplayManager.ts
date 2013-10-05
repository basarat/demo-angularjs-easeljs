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
    numberLocation: createjs.Point;
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

    annotationSetting = {
        color: 'white',
        shadow: '#000000',
        lineWidth: 4,

        circleRadius: 15,
        circleColor: '#00b8f1', // picme blue 
        circleBorderColor: '#FFFFFF',
        circleBorderRadius: 3,
        circleFontFamily: 'Arial Bold',
        circleFontSize: 20,
        circleFontYDisplacement: 12,
        circleFontColor: 'white',
    }

    drawingCanvas: createjs.Shape;
    drawingCanvasShadow: createjs.Shadow;

    annotationNumberLayer: createjs.Container;

    imageModel: UIAnnotateImage;

    canvaswidth: number = 1;
    canvasheight: number = 1;

    minZoom: number; // The minimum zoom level we will allow for the internal createjs canvas    

    constructor(public canvas: HTMLCanvasElement) {
        bindProtoFunctions(this);

        // Create the stage 
        this.stage = new createjs.Stage(canvas);
        createjs.Touch.enable(this.stage);

        // Create a drawing canvas for annotation drawings
        this.drawingCanvas = new createjs.Shape();
        this.drawingCanvasShadow = new createjs.Shadow(this.annotationSetting.shadow, 5, 5, 15);
        this.drawingCanvas.shadow = this.drawingCanvasShadow;
        this.stage.addChild(this.drawingCanvas);

        // Create a drawing container for annotation numbers
        this.annotationNumberLayer = new createjs.Container();
        this.stage.addChild(this.annotationNumberLayer);

        // Stage behaviours 
        this.stage.autoClear = true;
        this.stage.enableDOMEvents(true);

        // Setup event listener
        this.stage.addEventListener("stagemousedown", this.handleMouseDown);

        // Setup the load queue
        this.queue = new createjs.LoadQueue(false); // Using false to disble XHR only for file system based demo
    }

    private renderDrawing(annotationNumber: number, drawing: AnnotationDrawing) {
        // Draw the number         
        // Scale the values
        var circleRadius = this.annotationSetting.circleRadius / this.minZoom;
        var circleBorderRadius = circleRadius + this.annotationSetting.circleBorderRadius / this.minZoom;
        var fontSize = (this.annotationSetting.circleFontSize / this.minZoom);
        var fontYDisplacement = (this.annotationSetting.circleFontYDisplacement) / this.minZoom;
        var fontString = fontSize + 'px ' + this.annotationSetting.circleFontFamily;
        // Draw the circle 
        var circleShape = new createjs.Shape();
        var g = circleShape.graphics;
        g.beginFill(this.annotationSetting.circleBorderColor);
        g.drawCircle(drawing.numberLocation.x, drawing.numberLocation.y, circleBorderRadius);
        g.endFill();
        g.beginFill(this.annotationSetting.circleColor);
        g.drawCircle(drawing.numberLocation.x, drawing.numberLocation.y, circleRadius);
        g.endFill();
        this.annotationNumberLayer.addChild(circleShape);
        // Draw the text 
        var numberShape = new createjs.Text(annotationNumber.toString(), fontString, this.annotationSetting.circleFontColor);
        numberShape.x = drawing.numberLocation.x;
        numberShape.y = drawing.numberLocation.y - fontYDisplacement;
        numberShape.textAlign = 'center'
        this.annotationNumberLayer.addChild(numberShape);

        // Draw points 
        if (drawing.points.length == 0) return;

        var oldPt = drawing.points[0];
        var oldMidPt = oldPt.clone();

        _.forEach(drawing.points, (newPoint) => {
            var midPt = new createjs.Point((oldPt.x + newPoint.x) / 2, (oldPt.y + newPoint.y) / 2);

            this.drawingCanvas.graphics.moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);

            oldPt = newPoint.clone();
            oldMidPt = midPt.clone();
        });

    }

    private resetDrawingCanvas() {
        this.drawingCanvas.graphics.clear().setStrokeStyle(this.annotationSetting.lineWidth / this.minZoom, 'round', 'round');
    }

    private initialzeUnsavedAnnotations() {
        this.imageModel.unsavedAnnotation = { index: this.imageModel.annotations.length + 1, drawings: [] };
    }

    redraw() {
        if (!this.imageModel) return;

        // Clear
        this.resetDrawingCanvas();
        this.annotationNumberLayer.removeAllChildren();

        // Setup Start
        this.drawingCanvas.graphics.beginStroke(this.annotationSetting.color);

        _.forEach(this.imageModel.annotations, (annotation) => {
            _.forEach(annotation.drawings, (drawing) => {
                this.renderDrawing(annotation.index, drawing);
            });
        });

        _.forEach(this.imageModel.unsavedAnnotation.drawings, (drawing) => {
            this.renderDrawing(this.imageModel.unsavedAnnotation.index, drawing);
        });

        // Setup End
        this.drawingCanvas.graphics.endStroke();


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

        // At the end of the resize we need to do a redraw
        this.redraw();
    }

    setImageModel(imageModel: UIAnnotateImage) {
        if (!imageModel) return;
        this.imageModel = imageModel;

        // Initialize the unsavedAnnotations        
        this.initialzeUnsavedAnnotations();

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

    private isMouseOutsideImage() {
        return !this.image.hitTest(this.stage.mouseX / this.stage.scaleX, this.stage.mouseY / this.stage.scaleY);
    }

    handleMouseDown(event) {
        // If it is outside the image ignore 
        if (this.isMouseOutsideImage()) {
            return;
        }

        this.oldPt = new createjs.Point(this.stage.mouseX / this.stage.scaleX, this.stage.mouseY / this.stage.scaleY);
        this.oldMidPt = this.oldPt;

        this.stage.addEventListener("stagemousemove", this.handleMouseMove);
        this.stage.addEventListener("stagemouseup", this.handleMouseUp);


        this.currentPointAnnotation = {
            numberLocation: null,
            points: [this.oldPt.clone()]
        };

        this.drawingCanvas.graphics.beginStroke(this.annotationSetting.color);
    }

    handleMouseMove(event) {

        // If it is outside the image ignore 
        if (this.isMouseOutsideImage()) {
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

        // Calculate the number location: 
        // Find the min x and min y: 
        var minx: number = _.min(this.currentPointAnnotation.points, (point) => point.x).x;
        var miny: number = _.min(this.currentPointAnnotation.points, (point) => point.y).y;
        this.currentPointAnnotation.numberLocation = new createjs.Point(minx, miny);

        // Setup unsaved annotations if they are not already setup: 
        if (!this.imageModel.unsavedAnnotation) this.initialzeUnsavedAnnotations();
        // Add to the unsaved annotations 
        this.imageModel.unsavedAnnotation.drawings.push(this.currentPointAnnotation);

        // Just redraw: 
        this.redraw();
    }
}