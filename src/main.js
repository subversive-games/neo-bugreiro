var VIEW = {
    w: 640,
    h: 480,
};

var config = {
    width: VIEW.w,
    height: VIEW.h,
    camera: {
        width: 320,
        height: 240
    },
    parent: "body",
    debug: false,
    fps: 60,
    pixelated: true,
    roundPixels: false,
    floorTiles: true
};

var game = new scintilla.Game(config);
game.render.layer.add('game');


game.scene.add('logo', SceneLogo);
game.scene.add('title', SceneTitle);
game.scene.add('game', SceneGame);
game.scene.add('test', ScenePathFindTest);
//game.scene.set('test');
game.scene.set('logo');