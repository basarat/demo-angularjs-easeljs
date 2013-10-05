/// <reference path="../reference.ts" />

// Loads the size of the dom element as pixel values into the current scope 
// Use as : 
// <div load-size load-size-height='parentheight' load-size-width='parentwidth'></div> 
myApp.directives.directive('loadSize', ['$parse', function ($parse: ng.IParseService): ng.IDirective {
    return {
        restrict: 'A',
        link: (scope, element, attrs) => {

            // on windowResize
            var loadTheSize = _.debounce(() => {
                scope.$apply(() => {
                    var width = element.width();
                    var height = element.height();
                    $parse(attrs.loadSizeWidth).assign(scope, width);
                    $parse(attrs.loadSizeHeight).assign(scope, height);
                });
            }, 100);

            $(window).resize(loadTheSize);
            // Call it initially: 
            loadTheSize();
        }
    }
}]);