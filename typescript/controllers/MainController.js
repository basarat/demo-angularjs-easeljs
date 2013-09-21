var Controllers;
(function (Controllers) {
    var MainController = (function () {
        function MainController($scope, logService) {
            this.progress = 30;
            $scope.vm = this;
            logService.log("asdf");
        }
        MainController.prototype.inccc = function () {
            this.progress = this.progress + 10;
        };
        return MainController;
    })();
    Controllers.MainController = MainController;
})(Controllers || (Controllers = {}));
//# sourceMappingURL=MainController.js.map
