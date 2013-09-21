/// <reference path="../reference.ts" />
myApp.directives.directive('progressbar', function () {
    return {
        restrict: 'EAC',
        template: testme.html,
        scope: {
            progress: '='
        }
    };
});
//# sourceMappingURL=testmeDirective.js.map
