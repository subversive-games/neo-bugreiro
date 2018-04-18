
var MAX_FOLKS = 8;

var AntifaController = function () {
    this.deadFolkPlaces = [];
    this.deadCount = 0;
    this.fascistMode = true;
    this.naziChoices = 0;
    this.naziCount = 0;
    this.antifaCount = 0;
    this.killedFirstFolk = false;
    this.firstShoot = false;
    this.peace = true;
};

var GameEnvironment = function() {
    this.map = null;
    this.folks = [];
    this.player = null;
    this.endGame = 0;
    this.tribeArea = null;
    this.largeTribeArea = null;
    this.safePoints = null;

    this.removeFolk = function(folkToKill){
        var index = this.folks.indexOf(folkToKill);
        this.folks.splice(index, 1);
        folkToKill.behavior = null;
    }

    this.clear = function() {
        this.map = null;
        this.folks.length = 0;
        this.player = null;
        this.endGame = 0;
    }
}

var Environment = new GameEnvironment();

var AntifaControl = new AntifaController();