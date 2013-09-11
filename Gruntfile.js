module.exports = function (grunt) {

    // load the task
    grunt.loadNpmTasks("grunt-ts");

    // Configure grunt here
    grunt.initConfig({
        ts: {
            dev: {                          // a particular target
                src: ["typescript/**/*.ts"], // The source typescript files, http://gruntjs.com/configuring-tasks#files
                html: ["typescript/**/*.html"], // The source html files, https://github.com/basarat/grunt-ts#html-2-typescript-support
                reference: "./typescript/reference.ts",  // If specified, generate this file that you can use for your reference management
                watch: 'typescript',

                out: 'app/out.js',
                //outDir: 'app',              // The destination for javascript files 
                //amdloader: 'app/loader.js', // Use amd to load                
            },
        }
    });

    grunt.registerTask("default", ["ts:dev"]);
}