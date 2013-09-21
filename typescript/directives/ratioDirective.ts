/// <reference path="../reference.ts" />

/*
    - element should have css width set to 100%
    - Takes a ratio as height/width 
    - pushes out calculatedheight/calculatedwidth
    - Sets the element height as css  
*/
myApp.directives.directive('ratio', function ($parse: ng.IParseService) {

    return {
        restrict: 'A',

        link: function postLink(scope: ng.IScope, element, attrs) {

            var preserveRatio = () => {
                var ratio = $parse((<any>attrs).ratio)(scope);
                var width = element.width();
                var height = ratio * width;
                element.css('height', height + 'px');
                $parse(attrs.calculatedheight).assign(scope, height);
                $parse(attrs.calculatedwidth).assign(scope, width);
            };

            scope.$watch(attrs.ratio, (val) => {
                if (val)
                    preserveRatio();
            });

            // on windowResize
            var debouncedPreserveRatio = _.debounce(() => {
                scope.$apply(() => {
                    preserveRatio();
                });
            }, 100);

            $(window).resize(debouncedPreserveRatio);
        }
    }
});