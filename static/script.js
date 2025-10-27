let gameWidth, gameHeight;
let canvas;


let assets;
let numberMap;

var pipe = [];
var bird;
var fgBox1, fgBox2, playRect, leaderboardRect, shareRect;
var pressedW = false;
var released = true;

var hit = new Audio('/static/sounds/hit.mp3');
var fly = new Audio('/static/sounds/fly.mp3');
var score = new Audio('/static/sounds/score.mp3');


function loadAssets(names, files, onAllLoaded){
	console.log('Loading Images');
    var i = 0, numLoading = names.length;
	console.log('Assets to Load: ' + numLoading);
    const onload = () => {
		numLoading -= 1;
		console.log(' finished loading, ' + numLoading + ' left.');
		if(numLoading === 0) onAllLoaded()
	}

    const images = {};
    while (i < names.length) {
		const img = images[names[i]] = new Image();
		console.log('Loading ' + files[i] + '.png');
		img.src = "/static/images/" + files[i++] + ".png";
		img.onload = onload;
    }
    return images;
}



document.addEventListener('keydown', (e) => {
	if((e.code == 'KeyW' || e.code == 'Space') && !pressedW && released){
		pressedW = true;
		released = false;
		waitingToStart = false;
	}
});
document.addEventListener('keyup', (e) => {
	if(e.code == 'KeyW' || e.code == 'Space'){
		pressedW = false;
		released = true;
	}
});
document.addEventListener('click', (e) => {
	//if the game is over, see if we clicked on either box
	if(gameOver){

		var canvasRect = canvas.getBoundingClientRect();
		mouseX = e.pageX - canvasRect.left;
		mouseY = e.pageY - canvasRect.top;


		//console.log('we clicked at ' + mouseX + " , " + mouseY);
		//console.log(playRect.x + " , " + playRect.y + " , " + playRect.width + " , " + playRect.height);
		//first the play again button
		mouseRect = myRectangle(mouseX, mouseY, 1, 1);
		if(mouseRect.intersects(playRect)){
			playAgain();
		}else if(mouseRect.intersects(leaderboardRect)){
			leaderboardURL = document.location.href.toString().slice(0, -4) + "scoreboard";
			//console.log(leaderboardURL);
			//document.location.href = leaderboardURL;
			window.open(leaderboardURL);


		}else if(mouseRect.intersects(shareRect)){
			//get a name to add the players name and score to the leaderboard
			let name = prompt("Please enter your name!").trim();
			while(!(/^[a-zA-Z_]+$/.test(name))){//allow any characters A-Za-z0-9_
				name = prompt("Please Dont use wierd characters!").trim();
			}

			addScoreToLeaderboard(name, currentScore).then(r => {
				console.log(r);
			});
		}





	}

});


function myRectangle(x, y, width, height){
	rectangle = {};
	rectangle.x = x;
	rectangle.y = y;
	rectangle.width = width;
	rectangle.height = height;
	rectangle.intersects = function intersects(b){
		//if they intersect, return true, else false
		return (b.x + b.width) > this.x && b.y + b.height > this.y && this.x + this.width > b.x && this.y + this.height > b.y;
	}
	return rectangle;
}

//all of these will be configurable in server txt
var gameOver = false;
var highScore = 0;
var currentScore = 0;
var pipeSpeed = 2;
var targetPipeSpeed = 2;
var gapBetweenPipes = 400;
var gap = 140;
var absoluteZero;

//jump physics
var effectFromGravity = 1;
var maximumGravity = 2;
var effectFromJump = -13;
var vertSpeed = 0;
var ticksSinceJump = 0;
var ticksSinceSecond = 0;
var animationSpeed = 6;
var minimumTicksBetweenJumps = 13;

var currentY, minimumY, maximumY, medal;
var currentX, minimumX, maximumX;
var waitingToStart;
var scoreImageArray = [], highscoreImageArray = [];

var bronzeThreshold = 1, silverThreshold = 2, goldThreshold = 3, platinumThreshold = 4;

function playAgain(){
	//we have just clicked the play again button and we are restarting the game
	gameOver = false;
	setUpGame();
	console.log('Restarting!');
}

function render(){
    const ctx = canvas.getContext("2d");
	console.log('Rendering!');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(assets.bg, 0, 0, gameWidth, gameHeight);
	//draw and update pipes
	for(let i = 0; i < pipe.length; i++){
		ctx.drawImage(assets.topPipe, pipe[i].x, pipe[i].y - absoluteZero);
		ctx.drawImage(assets.bottomPipe, pipe[i].x, pipe[i].y + assets.topPipe.height - absoluteZero + gap);

		if(!waitingToStart) pipe[i].x-=pipeSpeed;
		if(pipe[i].x <= -assets.topPipe.width){
			if(i == 0){//stupid but it works
				pipe[i].x = pipe[1].x + gapBetweenPipes;
			}else {
				pipe[i].x = pipe[0].x + gapBetweenPipes;
			}
			pipe[i].y = Math.floor(Math.random() * 450);
			pipe[i].topRect.y = pipe[i].y - absoluteZero;
			pipe[i].bottomRect.y = pipe[i].y + assets.topPipe.height - absoluteZero + gap;
			pipe[i].scored = false;
		}

		pipe[i].topRect.x = pipe[i].x;
		pipe[i].bottomRect.x = pipe[i].x;

	}



	// ctx.fillStyle = 'yellow';
	// for(i = 0; i < pipe.length; i++){
	// 	let lineWidth = 4;
	// 	ctx.fillRect(pipe[i].topRect.x, pipe[i].topRect.y , lineWidth, pipe[i].topRect.height); //left
	// 	ctx.fillRect(pipe[i].topRect.x + pipe[i].topRect.width, pipe[i].topRect.y , lineWidth, pipe[i].topRect.height); //right
	// 	ctx.fillRect(pipe[i].topRect.x, pipe[i].topRect.y, pipe[i].topRect.width, lineWidth); // top
	// 	ctx.fillRect(pipe[i].topRect.x, pipe[i].topRect.y + pipe[i].topRect.height, pipe[i].topRect.width, lineWidth); // top
	//
	// 	ctx.fillRect(pipe[i].bottomRect.x, pipe[i].bottomRect.y , lineWidth, pipe[i].bottomRect.height); //left
	// 	ctx.fillRect(pipe[i].bottomRect.x + pipe[i].bottomRect.width, pipe[i].bottomRect.y , lineWidth, pipe[i].bottomRect.height); //right
	// 	ctx.fillRect(pipe[i].bottomRect.x, pipe[i].bottomRect.y, pipe[i].bottomRect.width, lineWidth); // top
	// 	ctx.fillRect(pipe[i].bottomRect.x, pipe[i].bottomRect.y + pipe[i].bottomRect.height, pipe[i].bottomRect.width, lineWidth); // top
	// }


	//draw the fgs

	//overlap the images by 38 hard coded

	if(!waitingToStart){
		fgBox1.x -= pipeSpeed;
		fgBox2.x -= pipeSpeed;
		fgBox3.x -= pipeSpeed;

		if(fgBox1.x <= -(fgBox1.width - pipeSpeed)) fgBox1.x = (fgBox1.width * 2) - 78;
		if(fgBox2.x <= -(fgBox1.width - pipeSpeed)) fgBox2.x = (fgBox1.width * 2) - 78;
		if(fgBox3.x <= -(fgBox1.width - pipeSpeed)) fgBox3.x = (fgBox1.width * 2) - 78;
	}

	ctx.drawImage(assets.fg, fgBox1.x, fgBox1.y);
	ctx.drawImage(assets.fg, fgBox2.x, fgBox2.y);
	ctx.drawImage(assets.fg, fgBox3.x, fgBox3.y);



	//
	// ctx.fillRect(fgBox1.x,0,1,gameHeight);
	// ctx.fillStyle = "blue";
	// ctx.fillRect(fgBox2.x,0,1,gameHeight);
	// ctx.fillStyle = "green";
	// ctx.fillRect(fgBox3.x,0,1,gameHeight);
	// ctx.fillStyle = "red";
	// ctx.fillRect(fgBox1.x, fgBox1.y + 20, fgBox1.width, 20);
	// ctx.fillStyle = "blue";
	// ctx.fillRect(fgBox2.x, fgBox2.y + 30, fgBox2.width, 20);
	// ctx.fillStyle = "green";
	// ctx.fillRect(fgBox3.x, fgBox3.y + 40, fgBox3.width, 20);
	// ctx.fillStyle = "yellow";
	// ctx.fillRect(fgBox3.x + fgBox3.width, fgBox3.y + 50, (38 * 2), 20);

	//update bird
	//so the fps is 60, allow them to press space, once every 60 seconds
	if(vertSpeed < maximumGravity) vertSpeed += effectFromGravity; //make us trend towards maximum gravity

	if(!gameOver && pressedW && (ticksSinceJump >= minimumTicksBetweenJumps)){//jump
		ticksSinceJump = 0;
		//bird vertical speed is -1 from gravity, if u press jump, the for the next few ticks it will increase until apex is met
		vertSpeed += effectFromJump;
		fly.play();
	}
	pressedW = false; //so u have to press it again
	ticksSinceJump++;
	ticksSinceSecond+=animationSpeed;

	if(!waitingToStart) bird.bounds.y += vertSpeed;

	if(ticksSinceSecond > 80){
		ctx.drawImage(assets.birdFlapDown, bird.bounds.x, bird.bounds.y);
	}else if(ticksSinceSecond < 40){
		ctx.drawImage(assets.birdFlapUp, bird.bounds.x, bird.bounds.y);
	}else if(ticksSinceSecond <= 80 && ticksSinceSecond >= 40){
		ctx.drawImage(assets.birdFlapMid, bird.bounds.x, bird.bounds.y);
	}

	if(ticksSinceSecond >= 120) ticksSinceSecond = 0;


	//check to see if pipe is past this line, then give score
	for(let a = 0; a < pipe.length; a++){
		if(pipe[a].topRect.x + pipe[a].topRect.width <= (bird.bounds.x - 1) && !pipe[a].scored) {
			pipe[a].scored = true;
			score.play();
			currentScore++;
		}
	}

	//alright now we need to update the text to show the score
	if(!gameOver){
		scoreImageArray = updateImageMath(currentScore);
		drawImageArray(ctx, scoreImageArray, gameWidth / 2, 100);
	}

	//now test for collision and kill if you die
	if(!gameOver && (bird.bounds.intersects(pipe[0].topRect) || bird.bounds.intersects(pipe[0].bottomRect) || bird.bounds.intersects(pipe[1].topRect) || bird.bounds.intersects(pipe[1].bottomRect) || bird.bounds.intersects(fgBox1) || bird.bounds.intersects(fgBox2) || bird.bounds.intersects(fgBox3))){
		//if we hit either of the pipes or the ground, then we die
		//if you want something to happen once put it here
		gameOver = true;
		console.log('We Just Died!');
		hit.play();

		//figure out which medal they get
		if(currentScore >= platinumThreshold) medal = assets.platinumMedal;
		else if(currentScore >= goldThreshold) medal = assets.goldMedal;
		else if(currentScore >= silverThreshold) medal = assets.silverMedal;
		else if(currentScore >= bronzeThreshold) medal = assets.bronzeMedal;
		else medal = null;



		if(currentScore > highScore) highScore = currentScore;

		console.log("score: " + currentScore + "  highscore: " + highScore);

		scoreImageArray = updateImageMath(currentScore, true);
		highscoreImageArray = updateImageMath(highScore, true);
	}

	if(gameOver){
		pipeSpeed = 0;
		currentY -= 15;
		if(currentY <= minimumY) currentY = minimumY;
		vertSpeed = 8;
	}else{
		pipeSpeed = targetPipeSpeed;
		//this means we are alive
		currentY += 15;
		if(currentY >= maximumY) currentY = maximumY;
	}

	let startX = (gameWidth / 2 - assets.endGameUI.width / 2);
	ctx.drawImage(assets.endGameUI, startX , currentY);
	if(medal != null) ctx.drawImage(medal, startX + 43, currentY + 70);
	ctx.drawImage(assets.gameover, startX + ((assets.endGameUI.width - assets.gameover.width) / 2), currentY - (assets.gameover.height + 19));
	ctx.drawImage(assets.playAgainBTN, startX, currentY + assets.endGameUI.height + 20);
	ctx.drawImage(assets.leaderboardBTN, startX + (assets.endGameUI.width - assets.leaderboardBTN.width), currentY + assets.endGameUI.height + 20);
	ctx.drawImage(assets.share, startX + (assets.endGameUI.width / 2 - assets.share.width / 2), currentY + assets.endGameUI.height + 40 + assets.playAgainBTN.height);

	drawImageArray(ctx, scoreImageArray, startX + 306, currentY + 59, true);
	drawImageArray(ctx, highscoreImageArray, startX + 306, currentY + 128, true);

	playRect = myRectangle((gameWidth / 2 - assets.endGameUI.width / 2), currentY + assets.endGameUI.height + 20, assets.playAgainBTN.width, assets.playAgainBTN.height);
	leaderboardRect = myRectangle((gameWidth / 2 - assets.endGameUI.width / 2) + (assets.endGameUI.width - assets.leaderboardBTN.width), currentY + assets.endGameUI.height + 20, assets.leaderboardBTN.width, assets.leaderboardBTN.height);
	shareRect = myRectangle(startX + (assets.endGameUI.width / 2 - assets.share.width / 2), currentY + assets.endGameUI.height + 40 + assets.playAgainBTN.height, assets.share.width, assets.share.height);

	//draw the instructions and get ready

	//ctx.drawImage(getReady, 100, 100);

	//left if float offscreen
	if(!waitingToStart){
		currentX -= pipeSpeed;
	}
	ctx.drawImage(assets.instructions, currentX, 201);








}

async function addScoreToLeaderboard(name, score){
	const response = await fetch('/play/addtoleaderboard',{
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify([{'name':name},{'score':score}])
	});

	const result = await response.json();
	console.log('response:   ' + response);
	return result.message;
}


$(document).ready(function () {


	$.getJSON('/get-settings', function(data) {

		for(let i = 0; i < data.length; i++){
			console.log(data[i]);

			switch (data[i][0]) {
				case 'targetPipeSpeed':
					targetPipeSpeed = Number(data[i][1]);
					break;
				case 'distanceBetweenPipes':
					gapBetweenPipes = Number(data[i][1]);
					break;
				case 'gap':
					gap = Number(data[i][1]);
					break;
				case 'effectFromGravity':
					effectFromGravity = Number(data[i][1]);
					break;
				case 'maximumGravity':
					maximumGravity = Number(data[i][1]);
					break;
				case 'effectFromJump':
					effectFromJump = Number(data[i][1]);
					break;
				case 'minimumTicksBetweenJumps':
					minimumTicksBetweenJumps = Number(data[i][1]);
					break;
				case 'bronzeThreshold':
					bronzeThreshold = Number(data[i][1]);
					break;
				case 'silverThreshold':
					silverThreshold = Number(data[i][1]);
					break;
				case 'goldThreshold':
					goldThreshold = Number(data[i][1]);
					break;
				case 'platinumThreshold':
					platinumThreshold = Number(data[i][1]);
					break;
			}
		}
	}).then(function(){
		//we must wait until we can set all the settings, then start the game

		//now that we have recieved data from the server, now we will wait to start the game until all images have been loaded

		console.log('Recieved Data From Server!');

		//now load images


		assets = loadAssets( 
		['birdFlapUp','birdFlapMid','birdFlapDown','bg','fg','topPipe','bottomPipe','getReady','instructions','number1','number2','number3','number4','number5','number6','number7','number8','number9','number0','numberLittle1','numberLittle2','numberLittle3','numberLittle4','numberLittle5','numberLittle6','numberLittle7','numberLittle8','numberLittle9','numberLittle0','endGameUI','gameover','playAgainBTN','leaderboardBTN','share','bronzeMedal','silverMedal','goldMedal','platinumMedal'],
		['bird-flapup','bird-midflap','bird-flapdown','bg2','fg','pipeNorth','pipeSouth','getready','instructions','digits/number1','digits/number2','digits/number3','digits/number4','digits/number5','digits/number6','digits/number7','digits/number8','digits/number9','digits/number0','digits/Little/number1','digits/Little/number2','digits/Little/number3','digits/Little/number4','digits/Little/number5','digits/Little/number6','digits/Little/number7','digits/Little/number8','digits/Little/number9','digits/Little/number0','end_game_UI','gameover','play_again_btn','leaderboard_btn','share','bronze_medal','silver_medal','gold_medal','platinum_medal'],
		setUpGame
		);

		interval = setInterval(render, 1000 / 60);

	});
});

function setUpGame(){
	//this function is called when the page first loads and when you press replay!
	console.log('Set up Game')

	canvas = document.getElementById('gameCanvas');

	gameWidth = 470;
	gameHeight = 834;
	canvas.setAttribute('width', gameWidth);
	canvas.setAttribute('height', gameHeight);

	canvas.tabIndex = 0;
	canvas.focus();

	console.log("game dimensions: "  + gameWidth + " x " + gameHeight);
	console.log("canvas dimensions: "  + canvas.width + " x " + canvas.height);

	pipe[0] = {
		x : gameWidth,
		y : 0,
		scored : false,
		topRect : myRectangle(this.x, this.y - absoluteZero, assets.topPipe.width + 2, assets.topPipe.height),
		bottomRect : myRectangle(this.x, this.y + assets.topPipe.height - absoluteZero + gap, assets.bottomPipe.width + 2, assets.bottomPipe.height)
	};
	pipe[1] = {
		x : gameWidth + gapBetweenPipes,
		y : gap,
		scored : false,
		topRect : myRectangle(this.x, this.y - absoluteZero, assets.topPipe.width + 2, assets.topPipe.height),
		bottomRect : myRectangle(this.x, this.y + assets.topPipe.height - absoluteZero + gap, assets.bottomPipe.width + 2, assets.bottomPipe.height)
	};

	//ctx.drawImage(assets.topPipe, pipe[i].x, pipe[i].y - absoluteZero);
	//ctx.drawImage(assets.bottomPipe, pipe[i].x, pipe[i].y + assets.topPipe.height - absoluteZero + gap);

	absoluteZero = assets.topPipe.height - 45;

	for(let i = 0; i < pipe.length; i++){
		pipe[i].topRect.x = pipe[i].x;
		pipe[i].bottomRect.x = pipe[i].x;
		pipe[i].topRect.y = pipe[i].y - absoluteZero;
		pipe[i].bottomRect.y = pipe[i].y + assets.topPipe.height - absoluteZero + gap;
		console.log('fixing pipe[' + i + "] collision issues");
	}

	bird = {
		x : 100,
		y : 300,
		width  : assets.birdFlapMid.width,
		height : assets.birdFlapMid.height,
		bounds : myRectangle(this.x, this.y, this.width, this.height)
	}
	bird.bounds = myRectangle(bird.x, bird.y, bird.width, bird.height);

	//in order for the boxes to overlap move 1 and 3 closer to 2
	let fgWidth = assets.fg.width;
	let fgHeight = assets.fg.height;
	fgBox1 = myRectangle(0, 	  		gameHeight - fgHeight, fgWidth, fgHeight);
	fgBox2 = myRectangle(fgWidth - 38, 		gameHeight - fgHeight, fgWidth, fgHeight);
	fgBox3 = myRectangle((fgWidth - 38) * 2, 	gameHeight - fgHeight, fgWidth, fgHeight);

	maximumY = gameHeight + assets.gameover.height + 20;
	minimumY = (gameHeight / 2 - (assets.endGameUI.height / 2));
	currentY = maximumY;

	currentScore = 0;
	maximumX = 34;
	minimumX = -210;
	currentX = maximumX;
	waitingToStart = true;
	//ready to play

					//then print out all the variables
	console.log("targetPipeSpeed: "  + targetPipeSpeed);
	console.log("gapBetweenPipes: "  + gapBetweenPipes);
	console.log("gap: "  + gap);
	console.log("");
	console.log("effectFromGravity: "  + effectFromGravity);
	console.log("maximumGravity: "  + maximumGravity);
	console.log("effectFromJump: "  + effectFromJump);
	console.log("minimumTicksBetweenJumps: "  + minimumTicksBetweenJumps);
	console.log("");
	console.log("fgBox1.x: "  + fgBox1.x);
	console.log("fgBox2.x: "  + fgBox2.x);
	console.log("fgBox3.x: "  + fgBox3.x);
	console.log("");
	console.log("pipeHeight: "  + assets.topPipe.height);
	console.log("absoluteZero: "  + (assets.topPipe.height - 45));
	console.log("currentY: "  + currentY);
	console.log("minimumY: "  + minimumY);
	console.log("maximumY: "  + maximumY);

	numberMap = [
		{number: '1', image: assets.number1, littleImage: assets.numberLittle1},
		{number: '2', image: assets.number2, littleImage: assets.numberLittle2},
		{number: '3', image: assets.number3, littleImage: assets.numberLittle3},
		{number: '4', image: assets.number4, littleImage: assets.numberLittle4},
		{number: '5', image: assets.number5, littleImage: assets.numberLittle5},
		{number: '6', image: assets.number6, littleImage: assets.numberLittle6},
		{number: '7', image: assets.number7, littleImage: assets.numberLittle7},
		{number: '8', image: assets.number8, littleImage: assets.numberLittle8},
		{number: '9', image: assets.number9, littleImage: assets.numberLittle9},
		{number: '0', image: assets.number0, littleImage: assets.numberLittle0}
	];






}

function updateImageMath(number, isLittle){
	imageArray = [];

	var characters = number.toString().split('');

	for(let i = 0; i < characters.length; i++){
		//loop throught character array and get image for each character
		for(let k = 0; k < numberMap.length; k++){
			if(characters[i] == numberMap[k].number){
				//so this is the letter we want
				if(isLittle) imageArray.push(numberMap[k].littleImage);
				else imageArray.push(numberMap[k].image);

			}
		}
	}



	return imageArray;
}
function drawImageArray(ctx, imageArray, centerX, topY, isLittle){
	let padding = 0;
	let widthProgress = 0;

	if(!isLittle){
		let startX = (centerX - ((imageArray.length * assets.number5.width) / 2));
		//console.log('centerX: ' + centerX + " , startX: " + startX);
		//alright now that we have our array of images for all the characters we have, display them
		for(let i = 0; i < imageArray.length; i++){
			ctx.drawImage(imageArray[i], startX + widthProgress, topY);
			widthProgress += imageArray[i].width + padding;
		}
	}else{
		let startX = (centerX - ((imageArray.length * assets.numberLittle5.width) / 2));
		//console.log('centerX: ' + centerX + " , startX: " + startX);
		//alright now that we have our array of images for all the characters we have, display them
		for(let i = 0; i < imageArray.length; i++){
			ctx.drawImage(imageArray[i], startX + widthProgress, topY);
			widthProgress += imageArray[i].width + padding;
		}
	}



}