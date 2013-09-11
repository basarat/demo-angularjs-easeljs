var Controllers;
(function (Controllers) {
    var MainController = (function () {
        function MainController($scope, logService) {
            this.message = "asdf";
            $scope.vm = this;
            logService.log('Some log');
        }
        return MainController;
    })();
    Controllers.MainController = MainController;
})(Controllers || (Controllers = {}));
//# sourceMappingURL=MainController.js.map
