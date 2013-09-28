/// <reference path="../reference.ts" />

interface UIAnnotateImage {
    width: number;
    height: number;
    uri: string;
    pointAnnotation: createjs.Point[][];
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

myApp.directives.directive('annotateimage', ['$isolator',function ($isolator:$isolatorService): ng.IDirective {
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
            var color = 'black';
            var stroke = 5;

            // Create a drawing canvas for our rendering
            var drawingCanvas = new createjs.Shape();
            stage.addChild(drawingCanvas);

            // Create a base image canvas
            var image: createjs.Bitmap;

            // Stage behaviours 
            stage.autoClear = true;
            stage.enableDOMEvents(true);

            function redraw() {
                if (!scope.image) return;

                // Draw points 
                if (scope.image.pointAnnotation.length) {
                    _.forEach(scope.image.pointAnnotation, (pointAnnotation) => {
                        if (pointAnnotation.length == 0) return;

                        var oldPt = pointAnnotation[0];
                        var oldMidPt = oldPt.clone();

                        _.forEach(pointAnnotation, (newPoint) => {
                            var midPt = new createjs.Point((oldPt.x + newPoint.x) / 2, (oldPt.y + newPoint.y) / 2);

                            drawingCanvas.graphics.beginStroke(color).moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);

                            oldPt = newPoint.clone();
                            oldMidPt = midPt.clone();
                        });
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
                var minZoom = scope.width / scope.image.width;
                if (minZoom.toPrecision(3) != (scope.height / scope.image.height).toPrecision(3)) {
                    console.warn('The scope width height does not match the aspect ratio of the image');
                    return;
                }

                // Set the zoom so that image takes up entire canvas
                // This allows us to zoom the stage and everything stays in proportion when we do that
                stage.scaleX = minZoom;
                stage.scaleY = minZoom;

                // Set the stroke based on the scale: 
                drawingCanvas.graphics.clear().setStrokeStyle(minZoom * 1.5, 'round', 'round');

                // At the end of the resize we need to do a redraw
                redraw();
            }

            // Modified : http://stackoverflow.com/a/2541680/390330
            function getAverageRGB(canvas: HTMLCanvasElement) {
                var rgb = { r: 0, g: 0, b: 0 };
                var data = canvas.getContext('2d').getImageData(0, 0, scope.image.width, scope.image.height);
                var length = data.data.length;

                var blockSize = 5; // only visit every 5 pixels; 
                var i = -4, count = 0;

                while ((i += blockSize * 4) < length) {
                    ++count;
                    rgb.r += data.data[i];
                    rgb.g += data.data[i + 1];
                    rgb.b += data.data[i + 2];
                }

                // ~~ used to floor values
                rgb.r = ~~(rgb.r / count);
                rgb.g = ~~(rgb.g / count);
                rgb.b = ~~(rgb.b / count);

                return rgb;
            }

            // Watch the image
            scope.$watch('image', () => {

                if (!scope.image) return;

                // TODO: actually remove everything.
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

                    // Get the image data : 
                    //var avgRGB = getAverageRGB(stage.canvas);
                    //console.log(avgRGB);

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

            var currentPointAnnotation: createjs.Point[];
            function handleMouseDown(event) {
                oldPt = new createjs.Point(stage.mouseX / stage.scaleX, stage.mouseY / stage.scaleY);
                oldMidPt = oldPt;

                stage.addEventListener("stagemousemove", handleMouseMove);
                stage.addEventListener("stagemouseup", handleMouseUp);

                currentPointAnnotation = [oldPt.clone()];
            }

            function handleMouseMove(event) {

                var newPoint = new createjs.Point(stage.mouseX / stage.scaleX, stage.mouseY / stage.scaleY);
                var midPt = new createjs.Point((oldPt.x + newPoint.x) / 2, (oldPt.y + newPoint.y) / 2);

                drawingCanvas.graphics.beginStroke(color).moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
                stage.update();

                oldPt = newPoint.clone();

                oldMidPt.x = midPt.x;
                oldMidPt.y = midPt.y;

                // Store 
                currentPointAnnotation.push(oldPt.clone());
            }

            function handleMouseUp(event) {
                stage.removeEventListener("stagemousemove", handleMouseMove);
                stage.removeEventListener("stagemouseup", handleMouseUp);

                scope.image.pointAnnotation.push(currentPointAnnotation);
            }

        }
    }
}]);