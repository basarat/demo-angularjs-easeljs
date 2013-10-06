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
    type: string;
    numberLocation: Point; // for quicker calc. Can be determined from points
    points?: Point[]; // valid for brushes
    rectangle?: { x: number; y: number; width: number; height: number; }
}

interface Point {
    x: number;
    y: number;
}

interface AnnotationTool {
    handleMouseDown(pixelx: number, pixely: number);
    handleMouseMove(pixelx: number, pixely: number);
    handleMouseUp(): AnnotationDrawing;
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

    drawingCanvas: createjs.Shape; // Used for already saved / unsaved annotations
    liveDrawingCanvas: createjs.Shape; // Used for current annotation in progress
    drawingCanvasShadow: createjs.Shadow;

    annotationNumberLayer: createjs.Container;

    imageModel: UIAnnotateImage;

    canvaswidth: number = 1;
    canvasheight: number = 1;

    minZoom: number; // The minimum zoom level we will allow for the internal createjs canvas
    currentZoom: number; // The current zoom level

    // The tools
    brushTool: BrushTool;
    rectangleTool: RectangleTool;
    activeTool: string;

    constructor(public canvas: HTMLCanvasElement) {
        bindProtoFunctions(this);

        // Create the stage 
        this.stage = new createjs.Stage(canvas);
        createjs.Touch.enable(this.stage);

        // Create a drawing canvas for annotation drawings
        this.drawingCanvasShadow = new createjs.Shadow(annotationsModule.annotationSetting.shadow, 5, 5, 15);

        this.drawingCanvas = new createjs.Shape();
        this.liveDrawingCanvas = new createjs.Shape();        

        this.drawingCanvas.shadow = this.drawingCanvasShadow;
        this.liveDrawingCanvas.shadow = this.drawingCanvasShadow;

        this.stage.addChild(this.drawingCanvas);
        this.stage.addChild(this.liveDrawingCanvas);


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

        // Setup the tools: 
        this.brushTool = new BrushTool(this.drawingCanvas,this.liveDrawingCanvas);
        this.rectangleTool = new RectangleTool(this.drawingCanvas, this.liveDrawingCanvas);

        // Setup the active tool:
        this.activeTool = ToolType.rectangle;
    }



    private renderDrawing(annotationNumber: number, drawing: AnnotationDrawing) {
        // Draw the number         
        // Scale the values
        var circleRadius = annotationsModule.annotationSetting.circleRadius / this.currentZoom;
        var circleBorderRadius = circleRadius + annotationsModule.annotationSetting.circleBorderRadius / this.currentZoom;
        var fontSize = (annotationsModule.annotationSetting.circleFontSize / this.currentZoom);
        var fontYDisplacement = (annotationsModule.annotationSetting.circleFontYDisplacement) / this.currentZoom;
        var fontString = fontSize + 'px ' + annotationsModule.annotationSetting.circleFontFamily;
        // Draw the circle 
        var circleShape = new createjs.Shape();
        var g = circleShape.graphics;
        g.beginFill(annotationsModule.annotationSetting.circleBorderColor);
        g.drawCircle(drawing.numberLocation.x, drawing.numberLocation.y, circleBorderRadius);
        g.endFill();
        g.beginFill(annotationsModule.annotationSetting.circleColor);
        g.drawCircle(drawing.numberLocation.x, drawing.numberLocation.y, circleRadius);
        g.endFill();
        this.annotationNumberLayer.addChild(circleShape);
        // Draw the text 
        var numberShape = new createjs.Text(annotationNumber.toString(), fontString, annotationsModule.annotationSetting.circleFontColor);
        numberShape.x = drawing.numberLocation.x;
        numberShape.y = drawing.numberLocation.y - fontYDisplacement;
        numberShape.textAlign = 'center'
        this.annotationNumberLayer.addChild(numberShape);

        // Call the tool to draw it out
        switch (drawing.type) {
            case ToolType.brush:
                this.brushTool.renderDrawing(drawing);
                break;
            case ToolType.rectangle:
                this.rectangleTool.renderDrawing(drawing);
        }
    }

    private resetDrawingCanvas() {
        this.drawingCanvas.graphics.clear().setStrokeStyle(annotationsModule.annotationSetting.lineWidth / this.currentZoom, 'round', 'round'); 
        this.resetLiveDrawingCanvas();      
    }

    private resetLiveDrawingCanvas() {
        this.liveDrawingCanvas.graphics.clear().setStrokeStyle(annotationsModule.annotationSetting.lineWidth / this.currentZoom, 'round', 'round');
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
        this.drawingCanvas.graphics.beginStroke(annotationsModule.annotationSetting.color);

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
        this.currentZoom = this.minZoom;

        // Set the zoom so that image takes up entire canvas
        // This allows us to zoom the stage and everything stays in proportion when we do that
        this.stage.scaleX = this.currentZoom;
        this.stage.scaleY = this.currentZoom;

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


    private isMouseOutsideImage() {
        return !this.image.hitTest(this.stage.mouseX / this.stage.scaleX, this.stage.mouseY / this.stage.scaleY);
    }

    handleMouseDown(event) {
        // If it is outside the image ignore 
        if (this.isMouseOutsideImage()) {
            return;
        }

        // Convert to image pixel points
        var pixelx = this.stage.mouseX / this.stage.scaleX;
        var pixely = this.stage.mouseY / this.stage.scaleY;

        // Setup event listeners
        this.stage.addEventListener("stagemousemove", this.handleMouseMove);
        this.stage.addEventListener("stagemouseup", this.handleMouseUp);

        // Inform the correct tool
        switch (this.activeTool) {
            case ToolType.brush:
                this.brushTool.handleMouseDown(pixelx, pixely);
                break;
            case ToolType.rectangle:
                this.rectangleTool.handleMouseDown(pixelx, pixely);
                break;
        }

        // Render it out 
        this.stage.update();
    }

    handleMouseMove(event) {
        // If it is outside the image ignore 
        if (this.isMouseOutsideImage()) {
            return;
        }

        // Convert to image pixel points
        var pixelx = this.stage.mouseX / this.stage.scaleX;
        var pixely = this.stage.mouseY / this.stage.scaleY;
                
        // Inform the correct tool
        switch (this.activeTool) {
            case ToolType.brush:
                this.brushTool.handleMouseMove(pixelx, pixely);
                break;
            case ToolType.rectangle:
                // As rect requires the liveCanvas to be refreshed we do that here: 
                this.resetLiveDrawingCanvas();
                this.rectangleTool.handleMouseMove(pixelx, pixely);
                break;
        }        

        // Render it out
        this.stage.update();
    }

    handleMouseUp(event) {
        this.stage.removeEventListener("stagemousemove", this.handleMouseMove);
        this.stage.removeEventListener("stagemouseup", this.handleMouseUp);

        // Will be returned by the tool 
        var currentAnnotation;

        // Inform the correct tool
        switch (this.activeTool) {
            case ToolType.brush:
                currentAnnotation = this.brushTool.handleMouseUp();
                break;
            case ToolType.rectangle:
                currentAnnotation = this.rectangleTool.handleMouseUp();
                break;
        }

        // If a new annotation was returned
        if (currentAnnotation) {
            // Setup unsaved annotations if they are not already setup: 
            if (!this.imageModel.unsavedAnnotation) this.initialzeUnsavedAnnotations();
            // Add to the unsaved annotations 
            this.imageModel.unsavedAnnotation.drawings.push(currentAnnotation);
        }

        // Just redraw: 
        this.redraw();
    }
}