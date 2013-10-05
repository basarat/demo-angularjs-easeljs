///<reference path="../reference.ts"/>

module Controllers {
    export class MainController {

        currentImage: UIAnnotateImage;

        image1: UIAnnotateImage = {
            uri: './images/550x190.png',
            width: 550,
            height: 190,
            annotations: []
        }

        image2: UIAnnotateImage = {
            uri: './images/spacesloth.jpg',
            width: 552,
            height: 704,
            annotations: []
        }

        constructor($scope) {
            $scope.vm = this;
            this.currentImage = this.image1;
        }

        save() {
            // Copy the unsaved annotation to saved annotations 
            if (this.image1.unsavedAnnotation)
                this.image1.annotations.push(this.image1.unsavedAnnotation);
            if (this.image2.unsavedAnnotation)
                this.image2.annotations.push(this.image2.unsavedAnnotation);
        }

        clear() {
        }
    }
}