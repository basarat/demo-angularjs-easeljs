/// <reference path="../reference.ts" />

myApp.directives.directive('testme',function():ng.IDirective{
    return {
        restrict: 'EAC',
        template: testme.html,
        scope: {
            progress: '='
        }
    }
})