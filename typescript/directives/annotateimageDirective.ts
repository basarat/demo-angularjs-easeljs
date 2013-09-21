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
            stage.addChild(drawingCanvas);

            // Point annotation 
            scope.pointAnnotation = [];

            function redraw() {
                if (!scope.image) return;

                console.log('clearning stage');


                // Draw points 
                if (scope.pointAnnotation.length) {
                    var oldPt = scope.pointAnnotation[0];
                    var oldMidPt = oldPt.clone();

                    _.forEach(scope.pointAnnotation, (newPoint) => {
                        var midPt = new createjs.Point((oldPt.x + newPoint.x) / 2, (oldPt.y + newPoint.y) / 2);

                        drawingCanvas.graphics.setStrokeStyle(stroke, 'round', 'round');
                        drawingCanvas.graphics.beginStroke(color).moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
                        stage.update();
                        drawingCanvas.graphics.clear();

                        oldPt = newPoint.clone();
                        oldMidPt = midPt.clone();
                    });
                }

                // Render it out
                console.log('updating stage');
                stage.update();
            }

            // Watch the image
            scope.$watch('image', () => {
                redraw();
            }, true);

            function resize() {
                // Set the canvas width / height 
                stage.canvas.width = scope.width;
                stage.canvas.height = scope.height;

                // At the end of the resize we need to do a redraw
                redraw();
            }
            scope.$watch('width', resize);
            scope.$watch('height', resize);

            /* From sample */
            var oldPt;
            var oldMidPt;
            var title;
            var index;

            index = 0;



            stage.autoClear = false;
            stage.enableDOMEvents(true);


            stage.addEventListener("stagemousedown", handleMouseDown);
            stage.addEventListener("stagemouseup", handleMouseUp);


            // Finally redraw 
            redraw();

            function handleMouseDown(event) {
                oldPt = new createjs.Point(stage.mouseX, stage.mouseY);
                oldMidPt = oldPt;
                stage.addEventListener("stagemousemove", handleMouseMove);

                scope.pointAnnotation = [oldPt.clone()];               
            }

            function handleMouseMove(event) {

                var newPoint = new createjs.Point(stage.mouseX, stage.mouseY);

                var midPt = new createjs.Point( (oldPt.x + newPoint.x) / 2 , (oldPt.y + newPoint.y) / 2);

                drawingCanvas.graphics.setStrokeStyle(stroke, 'round', 'round');
                drawingCanvas.graphics.beginStroke(color).moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
                stage.update();
                drawingCanvas.graphics.clear();

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