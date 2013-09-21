/// <reference path="../reference.ts" />

interface UIAnnotateImage {
    width: number;
    height: number;
    uri: string;
}

interface Point {
    x: number;
    y: number;
}

interface AnnotateImageDirectiveScope extends ng.IScope {
    image: UIAnnotateImage;
    width: number;
    height: number;

    pointAnnotation: createjs.Point[];
}

myApp.directives.directive('annotateimage', function (): ng.IDirective {
    return {
        restrict: 'E',
        template: annotateimage.html,
        scope: {
            image: '=',
            width: '=',
            height: '=',
        },
        link: (scope: AnnotateImageDirectiveScope, element: JQuery, attrs) => {

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
            drawingCanvas.graphics.setStrokeStyle(stroke, 'round', 'round');
            stage.addChild(drawingCanvas);

            // Create a base image canvas
            var image: createjs.Bitmap;
            
            // Stage behaviours 
            stage.autoClear = true;
            stage.enableDOMEvents(true);

            // Point annotation 
            scope.pointAnnotation = [];

            function redraw() {
                if (!scope.image) return;

                
                // Draw points 
                if (scope.pointAnnotation.length) {
                    var oldPt = scope.pointAnnotation[0];
                    var oldMidPt = oldPt.clone();

                    _.forEach(scope.pointAnnotation, (newPoint) => {
                        var midPt = new createjs.Point((oldPt.x + newPoint.x) / 2, (oldPt.y + newPoint.y) / 2);

                        drawingCanvas.graphics.beginStroke(color).moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
                        
                        oldPt = newPoint.clone();
                        oldMidPt = midPt.clone();
                    });
                }

                // Render it out
                stage.update();
            }

            function resize() {
                // Depends upon width/height/image to all be set on scope 
                if (!scope.width || !scope.height || !scope.image) return; 

                // Assumption. The width / height of container matches the proportion for image. 
                // This is done by parent already 

                // Set the canvas width / height 
                stage.canvas.width = scope.width;
                stage.canvas.height = scope.height;

                // Set the zoom so that image takes up entire canvas
                // This allows us to zoom the stage and everything stays in proportion when we do that
                stage.scaleX = scope.width / scope.image.width;
                stage.scaleY = scope.height / scope.image.height;

               
                // At the end of the resize we need to do a redraw
                redraw();
            }

            // Watch the image
            scope.$watch('image', () => {

                if (!scope.image) return;  

                // TODO: actually remove everything.
                // And resetup drawing canvas etc. 

                image = new createjs.Bitmap(scope.image.uri);
                stage.addChildAt(image, 0);

                resize();
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


            stage.addEventListener("stagemousedown", handleMouseDown);
            stage.addEventListener("stagemouseup", handleMouseUp);


            // Finally redraw 
            redraw();

            function handleMouseDown(event) {
                oldPt = new createjs.Point(stage.mouseX/stage.scaleX, stage.mouseY/stage.scaleY);
                oldMidPt = oldPt;
                stage.addEventListener("stagemousemove", handleMouseMove);

                scope.pointAnnotation = [oldPt.clone()];
            }

            function handleMouseMove(event) {

                var newPoint = new createjs.Point(stage.mouseX/stage.scaleX, stage.mouseY/stage.scaleY);
                var midPt = new createjs.Point((oldPt.x + newPoint.x) / 2, (oldPt.y + newPoint.y) / 2);

                drawingCanvas.graphics.beginStroke(color).moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
                stage.update();

                oldPt = newPoint.clone();

                oldMidPt.x = midPt.x;
                oldMidPt.y = midPt.y;

                // Store 
                scope.pointAnnotation.push(oldPt.clone());
            }

            function handleMouseUp(event) {
                stage.removeEventListener("stagemousemove", handleMouseMove);
            }

        }
    }
})