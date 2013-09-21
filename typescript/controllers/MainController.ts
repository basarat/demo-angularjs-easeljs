module Controllers{
    export class MainController{
        progress = 30; 
        constructor($scope,logService:LogService) {
            $scope.vm = this; 
            logService.log("asdf"); 
        } 

        inccc() {
            this.progress = this.progress + 10; 
        }
    }
}