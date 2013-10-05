///<reference path="../reference.ts"/>

module Controllers{
    export class MainController{

        currentImage: UIAnnotateImage;

        image1: UIAnnotateImage = {
            uri: './images/550x190.png',
            width: 550,
            height: 190,
            annotation: null
        }

        image2: UIAnnotateImage = {
            uri: './images/spacesloth.jpg',
            width: 552,
            height: 704,
            annotation: null
        }

        constructor($scope) {
            $scope.vm = this;
            this.currentImage = this.image1; 
        } 

    }
}