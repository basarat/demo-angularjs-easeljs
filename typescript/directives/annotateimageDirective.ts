/// <reference path="../reference.ts" />

interface UIAnnotateImage {
    width: number;
    height: number;
    uri: string;
    annotations: Annotation[];
}

interface Annotation {
    //type: string;
    points?: createjs.Point[]; // valid for brushes
}

interface Point {
    x: number;
    y: number;
}

interface AnnotateImageDirectiveScope extends ng.IScope {
    image: UIAnnotateImage;
    width: number;
    height: number;
}

myApp.directives.directive('annotateimage', ['$isolator', function ($isolator: $isolatorService): ng.IDirective {
    return {
        restrict: 'E',
        link: (scope: AnnotateImageDirectiveScope, element, attrs) => {
            scope = $isolator.setupDirective(
                {
                    image: '=',
                    width: '=',
                    height: '=',
                }, scope, element, attrs, annotateimage.html);

            // Find the canvas
            var canvas: HTMLCanvasElement = <HTMLCanvasElement>element.find('canvas')[0];

            // Create the stage 
            var stage = new createjs.Stage(canvas);
            createjs.Touch.enable(stage);

            // Defaults
            var color = 'white';            

            // Create a drawing canvas for our rendering
            var drawingCanvas = new createjs.Shape();
            drawingCanvas.shadow = new createjs.Shadow("#000000", 5, 5, 10);
            stage.addChild(drawingCanvas);

            // Create a base image canvas
            var image: createjs.Bitmap;

            // Stage behaviours 
            stage.autoClear = true;
            stage.enableDOMEvents(true);

            function redraw() {
                if (!scope.image) return;

                // Draw points 
                if (scope.image.annotations.length) {
                    _.forEach(scope.image.annotations, (pointAnnotation) => {
                        if (pointAnnotation.points.length == 0) return;

                        var oldPt = pointAnnotation.points[0];
                        var oldMidPt = oldPt.clone();

                        drawingCanvas.graphics.beginStroke(color);

                        _.forEach(pointAnnotation.points, (newPoint) => {
                            var midPt = new createjs.Point((oldPt.x + newPoint.x) / 2, (oldPt.y + newPoint.y) / 2);

                            drawingCanvas.graphics.moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);

                            oldPt = newPoint.clone();
                            oldMidPt = midPt.clone();
                        });

                        drawingCanvas.graphics.endStroke();
                    });
                }

                // Render it out
                stage.update();
            }

            var minZoom: number;
            function resize() {
                // Depends upon width/height/image to all be set on scope 
                if (!scope.width || !scope.height || !scope.image) return;

                // Set the canvas width / height 
                stage.canvas.width = scope.width;
                stage.canvas.height = scope.height;

                // Assumption. The width / height of container matches the proportion for image. 
                // This is done by parent already
                var widthZoom = scope.width / scope.image.width;
                var heightZoom = scope.height / scope.image.height;
                minZoom = Math.min(widthZoom, heightZoom);

                // Set the zoom so that image takes up entire canvas
                // This allows us to zoom the stage and everything stays in proportion when we do that
                stage.scaleX = minZoom;
                stage.scaleY = minZoom;

                // Set the stroke based on the scale: 
                drawingCanvas.graphics.clear().setStrokeStyle(7 * (1 / minZoom), 'round', 'round');

                // At the end of the resize we need to do a redraw
                redraw();
            }

            // Watch the image
            scope.$watch('image', () => {

                if (!scope.image) return;

                // TODO: actually remove everything.
                // We are not removing the drawing canvas right now
                if (image) {
                    stage.removeChildAt(0);
                }

                // Load the image async
                var queue = new createjs.LoadQueue(false); // Using false to disble XHR only for file system based demo
                queue.addEventListener("complete", onComplete);
                queue.loadManifest([
                    { id: "myImage", src: scope.image.uri }
                ]);

                function onComplete() {
                    // Get , add , draw the image
                    image = new createjs.Bitmap(queue.getResult("myImage"));
                    stage.addChildAt(image, 0);
                    stage.update();

                    resize();
                }
            }, true);

            // Watch the size 
            scope.$watch('width', () => { resize() });
            scope.$watch('height', () => { resize() });

            /* From sample */
            var oldPt;
            var oldMidPt;
            var title;
            var index;

            index = 0;

            // Setup event listener
            stage.addEventListener("stagemousedown", handleMouseDown);

            var currentPointAnnotation: Annotation;
            function handleMouseDown(event) {
                oldPt = new createjs.Point(stage.mouseX / stage.scaleX, stage.mouseY / stage.scaleY);
                oldMidPt = oldPt;

                stage.addEventListener("stagemousemove", handleMouseMove);
                stage.addEventListener("stagemouseup", handleMouseUp);

                currentPointAnnotation = {
                    points:[oldPt.clone()]
                };

                drawingCanvas.graphics.beginStroke(color);
            }

            function handleMouseMove(event) {

                // If it is outside the image ignore 
                if (!image.hitTest(stage.mouseX / stage.scaleX, stage.mouseY / stage.scaleY)) {
                    return;
                }

                var newPoint = new createjs.Point(stage.mouseX / stage.scaleX, stage.mouseY / stage.scaleY);
                var midPt = new createjs.Point((oldPt.x + newPoint.x) / 2, (oldPt.y + newPoint.y) / 2);

                drawingCanvas.graphics.moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
                stage.update();

                oldPt = newPoint.clone();

                oldMidPt.x = midPt.x;
                oldMidPt.y = midPt.y;

                // Store 
                currentPointAnnotation.points.push(oldPt.clone());
            }

            function handleMouseUp(event) {
                stage.removeEventListener("stagemousemove", handleMouseMove);
                stage.removeEventListener("stagemouseup", handleMouseUp);

                scope.image.annotations.push(currentPointAnnotation);

                drawingCanvas.graphics.endStroke();
            }

        }
    }
}]);