///<reference path="../reference.ts"/>

module Controllers {
    export class MainController {

        currentImage: UIAnnotateImage;

        image1: UIAnnotateImage = {
            uri: './images/landscape.jpg',
            width: 1920,
            height: 1200,
            annotations: []
        }

        image2: UIAnnotateImage = {
            uri: './images/spacesloth.jpg',
            width: 552,
            height: 704,
            annotations: []
        }

        tool = 'brush';

        constructor($scope) {
            $scope.vm = this;
            this.currentImage = this.image1;
        }

        save() {
            // Copy the unsaved annotation to saved annotations 
            if (this.image1.unsavedAnnotation && this.image1.unsavedAnnotation.drawings.length) {
                this.image1.annotations.push(this.image1.unsavedAnnotation);
                this.image1.unsavedAnnotation = null;
            }
            if (this.image2.unsavedAnnotation && this.image2.unsavedAnnotation.drawings.length) {
                this.image2.annotations.push(this.image2.unsavedAnnotation);
                this.image2.unsavedAnnotation = null;
            }
        }

        settool(tool) {
            this.tool = tool;
        }
    }
}