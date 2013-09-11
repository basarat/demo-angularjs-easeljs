module Controllers{
    export class MainController{
        message = "asdf";
        progress = 0; 
        constructor($scope,logService:LogService){
            $scope.vm = this;
            logService.log('Some log');
        }

        increaseProgress() {
            this.progress += 10; 
        }
    }
}