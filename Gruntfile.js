module.exports = function (grunt) {

        // Project configuration.
        grunt.initConfig({
                pkg: grunt.file.readJSON('package.json'),

                concat: {
                    options: {
                        separator: ';',
                        stripBanners: true,
                        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - */\n',
                    },
                    dist: {
                        src: ['src/AntifaControl.js', 'src/PathFinding.js',
                         'src/TileFunctions.js', 'src/TileCollision.js',
                         'src/BugreiroFunctions.js', 'src/Bugreiro.js', 'src/BugreiroAI.js',
                         'src/FolkFunctions.js','src/Folk.js',
                         'src/Effects.js', 'src/BulletShoot.js',
                         'src/SceneLogo.js','src/SceneTitle.js',
                         'src/GameSettings.js', 'src/GameControlFunctions.js',
                         'src/SceneGame.js',
                         'src/ScenePathFindTest.js', 'src/*.js',
                         'src/main.js'],
                        dest: 'dist/<%= pkg.name %>.js',
                    },

                },

                uglify: {
                    options: {
                        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
                        reserved: ['scintilla']
                    },
                    dist: {
                        files: {
                            'release/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
                        }
                    }
                }
        });

        // Load the plugin that provides the "uglify" task.
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-contrib-concat');

// Default task(s).
grunt.registerTask('default', ['concat', 'uglify']);
    };

