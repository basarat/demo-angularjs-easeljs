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

            var manager = new AnnotationDisplayManager(canvas);

            


            // Watch the image
            scope.$watch('image', () => {
                manager.setImageModel(scope.image);
            }, true);

            // Watch the size 
            scope.$watch('width', () => { manager.resize(scope.width,scope.height) });
            scope.$watch('height', () => { manager.resize(scope.width, scope.height) });
        }
    }
}]);