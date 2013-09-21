module Controllers{
    export class MainController{

        image: UIAnnotateImage = {
            uri: '/app/images/550x190.png',
            width: 550,
            height: 190
        }

        constructor($scope) {
            $scope.vm = this; 
        } 

    }
}