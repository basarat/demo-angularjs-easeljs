/// <reference path="../reference.ts" />



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
            // Setup the manager only once
            var manager = new AnnotationDisplayManager(canvas);

            // Watch the image
            scope.$watch('image', () => {
                manager.setImageModel(scope.image);
            });

            // Watch the size 
            scope.$watch('width', () => { manager.resize(scope.width,scope.height) });
            scope.$watch('height', () => { manager.resize(scope.width, scope.height) });
        }
    }
}]);