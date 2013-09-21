var Controllers;
(function (Controllers) {
    var TestController = (function () {
        function TestController($scope) {
            this.message = "foo";
            $scope.vm = this;
        }
        return TestController;
    })();
    Controllers.TestController = TestController;
})(Controllers || (Controllers = {}));
//# sourceMappingURL=TestController.js.map
