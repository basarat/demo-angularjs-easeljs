/// <reference path="../reference.ts" />

interface UIAnnotateImage {
    uri: string; 
}

interface AnnotateImageDirectiveScope extends ng.IScope{
    image: UIAnnotateImage;
}

myApp.directives.directive('annotateimage',function():ng.IDirective{
    return {
        restrict: 'E',
        template: annotateimage.html,
        scope: {
            image: '='
        },
        link: (scope: AnnotateImageDirectiveScope, element: JQuery, attrs) => {
            
            // Find the canvas
            var canvas: HTMLCanvasElement = <HTMLCanvasElement>element.find('canvas')[0];
            
            // Create the stage 
            var stage = new createjs.Stage(canvas); 
            createjs.Touch.enable(stage);

            // Set the canvas size: 
            stage.canvas.width = 1920;
            stage.canvas.height= 1080;

            /* From sample */
            var drawingCanvas;
            var oldPt;
            var oldMidPt;
            var title;
            var color;
            var stroke;
            var colors;
            var index;

            index = 0;

            color = 'black';
            stroke = 5;

            stage.autoClear = false;
            stage.enableDOMEvents(true);

            
            createjs.Ticker.setFPS(24);

            drawingCanvas = new createjs.Shape();

            stage.addEventListener("stagemousedown", handleMouseDown);
            stage.addEventListener("stagemouseup", handleMouseUp);

           
            stage.addChild(drawingCanvas);
            stage.update();

            function handleMouseDown(event) {
                if (stage.contains(title)) { stage.clear(); stage.removeChild(title); }
                oldPt = new createjs.Point(stage.mouseX, stage.mouseY);
                oldMidPt = oldPt;
                stage.addEventListener("stagemousemove", handleMouseMove);
            }

            function handleMouseMove(event) {
                var midPt = new createjs.Point(oldPt.x + stage.mouseX >> 1, oldPt.y + stage.mouseY >> 1);

                drawingCanvas.graphics.clear().setStrokeStyle(stroke, 'round', 'round').beginStroke(color).moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);

                oldPt.x = stage.mouseX;
                oldPt.y = stage.mouseY;

                oldMidPt.x = midPt.x;
                oldMidPt.y = midPt.y;

                stage.update();
            }

            function handleMouseUp(event) {
                stage.removeEventListener("stagemousemove", handleMouseMove);
            }
             
        }
    }
})