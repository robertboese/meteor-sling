//Robert Boese
//Meteor Sling

//Final Project for LSU CSC 2463

//basic global variables
var meteor;
var ship = [];
var shipcount = 30;
var gamestart = false;
var gameover = false;
var speed = 4;
var time = 30;
var frames = 1;
var framerate = 12;
var score = 0;
    
//variables to determine the position of the meteor/slingshot    
var initX = 375;
var initY = 500;
var meteorX = 375;
var meteorY = 500;
var meteorVx = 0;
var meteorVy = 0;
var dt = 0.1;
var deltaVx = 0;
var deltaVy = 0;
var slingX = 0;
var slingY = 0;
var velocity_scale = 1.5;
var deltaX = 0;
var deltaY = 0;
var slingshotExists = false;
var meteorMoving = false;

//music + sound effect variables (Tone)
var sfx;
var synth;
var seq;

//hardware variables (Arduino/serial integration)
var joystick = [0,0,1];
var buttonPressed = 1;
var serial;
var latestData = 'waiting for data';
const portName = 'COM3';
    
//preload creates the array of spaceship objects that will spawn periodically
function preload() {  
  for(var i = 0; i < shipcount; i++){
     ship[i] = new Spaceship("ufo.png");
  }  
}

//sets up canvas, sfx + synths for audio, and serial data variables for input/output
function setup() {
  
  frameRate(framerate);
  createCanvas(750, 600);
  imageMode(CENTER);
  
  sfx = new Tone.Player("complete.mp3").toDestination();
  
  synth = new Tone.AMSynth().toDestination();
  
  //title screen jingle on start
  if(!gamestart && !gameover){
    now = Tone.now();
    
    synth.triggerAttackRelease('Bb3','2n',now);
    synth.triggerAttackRelease('Eb4','2n',now+0.5);
    synth.triggerAttackRelease('Bb4','2n',now+1);
    synth.triggerAttackRelease('A4','4n',now+1.5);
    synth.triggerAttackRelease('F4','4n',now+1.75);
    synth.triggerAttackRelease('G4','2n',now+2.0);
  }
  
  //main looping theme of game, will get sped up as score increases later on
  seq = new Tone.Sequence((time, note) => {
    synth.triggerAttackRelease(note, 0.1, time);
  }, ["Gb2", "Gb3", "E3", "Eb3", "Db3", "B2", ["Bb2", "B2"], ["Db3","B2"], "Bb2","Gb2","Ab2","Db2"]).start(0);
  
  serial = new p5.SerialPort();
  serial.open(portName);
  serial.on('data', gotData);
}

function gotData() {
  latestData = serial.readLine();
  trim(latestData);
  if(!latestData) return;
  joystick = split(latestData, ',');
  joystick[0] = parseInt(joystick[0]);
  joystick[1] = parseInt(joystick[1]);
  joystick[2] = parseInt(joystick[2]);
  //console.log(joystick);
  serial.write('A');
}

//if the meteor touches the ufo, destroy/delete it from the object array
function killAttempt(){
  for(var i = 0; i < ship.length;i++){
    if(gamestart && meteorX > ship[i].x - 40 && meteorX < ship[i].x + 40 && meteorY > ship[i].y - 32 && meteorY < ship[i].y+32){
        if(ship[i].kill === false){
          ship[i].moving = 0;
          ship[i].frame = 0;
        }
        ship[i].kill = true;
        return;    
    }
  }
}

//draws a line from the meteor's center that's used in calculating its trajectory
function drawSlingshot(){  
  slingshotExists = true;
  slingX = meteorX + joystick[0];
  slingY = meteorY + joystick[1];
  meteorVx = 0;
  meteorVy = 0;    
  stroke(255);
  strokeWeight(3);
  //console.log(slingX,slingY);
  line(meteorX,meteorY,slingX,slingY);
}

//sets the values of velocity at the moment of release, also sounds a short beep from the buzzer
function buttonReleased(){
  
  if(slingshotExists){
    //serial.write('L');    
    deltaVx = slingX - meteorX;
    deltaVy = meteorY - slingY;
    //console.log(deltaVx,deltaVy);
    serial.write('L');
    slingshotExists = false;
  }  
}

//basic shape draw function for meteor
function drawMeteor(x,y){
  stroke(255);
  strokeWeight(2);
  fill(0);
  circle(x,y,40);    
}

//makes Enter start the game
function keyPressed(){
  if(keyCode == ENTER){
    gamestart = true;
  }
}

//major draw function in which all facets of the game get updated and game states are updated based on set parameters
function draw() {
  
  if(gameover){
    background(0);
    
    Tone.Transport.stop("0.1");
    
    endgame();
    return;
  }
  
  if(gamestart){
    background(0);
    
    if(buttonPressed == 1 && (meteorVx != 0 || meteorVy != 0)){
      killAttempt();
    }    
        
    Tone.Transport.start();
    Tone.Transport.bpm.rampTo(180,30);
    
    //decreases time value by 1 each second
    if(frames % framerate == 0)
      time--;
    
    frames++;
    
    if(ship.length == 0){
      gameover = true;
      gamestart = false;
      sfx.start();
      return;
    }
    
    if(time < 0){
      gameover = true;
      gamestart = false;
      sfx.start();
      return;
    }
    
    for(i = 0; i < ship.length; i++){
      ship[i].draw();
    }
    
    for(i = 0; i < ship.length; i++){
      if(ship[i].kill){
        ship.splice(i,1);
        score++;
        speed++;
      }
    }
    
    stroke(255);
    fill(255);
    text("TIME REMAINING:    " + time,200,40);
    
    //update meteor velocity based on the length of the slingshot and a scalar velocity variable
    meteorVx += -velocity_scale * deltaVx;
    meteorVy += velocity_scale * deltaVy;
    
    //update meteor position based on velocity
    meteorX += meteorVx*dt;
    meteorY += meteorVy*dt;
    
    //reset change in velocity
    deltaVx = 0;
    deltaVy = 0;
    
    //slingX = joystick[0];
    //slingY = joystick[1];
    buttonPressed = joystick[2];
    
    if(buttonPressed == 0){
      meteorX = initX;
      meteorY = initY;
      drawSlingshot();
    }
    
    if(buttonPressed == 1){
      buttonReleased();
    }
        
    drawMeteor(meteorX,meteorY);
    
  }
  else{
    background(0);
    fill(255);
    textSize(46);
    textAlign(CENTER);
    text("METEOR SLING", width/2, 300);
    textSize(32);
    text("[Press the joystick button and pull to launch.]", width/2,450);
    text("[ENTER to start.]",width/2,500)
  } 
}

//very similar to the bug object from last project, has objects moving horizontally instead of vertically
function Spaceship(imageName){
  this.spriteSheet = loadImage(imageName);
  this.frame = 0;
  this.x = Math.floor(random(40,710));
  this.y = Math.floor(random(40,400));
  this.kill = false;
  
  if(Math.floor(random(0,2)) === 0){
    this.moving = 1;
  }
  else{
    this.moving = -1;
  }
  
  this.draw = function(){
    
    push();
    
    translate(this.x,this.y);
    
    if(this.kill){
      if(this.moving<0){
        scale(-1.0,1.0);
      }
      
      if(this.frame == 0){
        //serial.write('H');
        image(this.spriteSheet,0,0,40,24,80,0,40,24);
      }
      if(this.frame == 1){
        image(this.spriteSheet,0,0,40,24,120,0,40,24);
      }
      if(this.frame == 2){
        image(this.spriteSheet,0,0,40,24,160,0,40,24);
      }
      if(this.frame == 3){
        //serial.write('L');
        image(this.spriteSheet,0,0,40,24,200,0,40,24);
      }
      
      this.frame++;
      
      pop();
      return;
    } 
    
    if(this.moving < 0){
      scale(-1.0,1.0);
    }
    
    if(this.moving == 0){
      image(this.spriteSheet,0,0,40,24,0,0,40,24);
    }
    
    else{
      if(this.frame == 0){
        image(this.spriteSheet,0,0,40,24,0,0,40,24);
      }
      if(this.frame == 1){
        image(this.spriteSheet,0,0,40,24,40,0,40,24);
      }
      
      this.frame++;
      
      if(this.frame > 1) this.frame = 0;
      
      this.x = this.x + this.moving * speed;
      if(this.x < 40) this.moving = 1;
      if(this.x > width-40) this.moving = -1;
    }    
    pop();
  } 
}

//re-establishes starting variables when the game ends so that when the game is potentially restarted, the new values are fresh
function endgame(){
  ship = [];
  shipcount = 30;  
  speed = 4;
  time = 30;
  frames = 0;
  meteorX = initX;
  meteorY = initY;
  meteorVx = 0;
  meteorVy = 0;
  
  //resets bpm of game theme
  Tone.Transport.bpm.value = 120;
  
  //if the game is started again with "Enter", initiates a new set of ships and resets gameover state and score
  if(gamestart == true){
    for(var i = 0; i < shipcount; i++){
      ship[i] = new Spaceship("ufo.png");
    }
    gameover = false;
    score = 0;
  }
  
  //has to be under the above if-statement so that it still works, otherwise it would overwrite gamestart every time "Enter" is pressed
  gamestart = false;

  //text after the game is completed (time runs out or all ships destroyed) that prompts user to press Enter to return to title screen
  textAlign(CENTER);
  fill(255);
  text("You shot down " + score + " invaders.",width/2,290);
  text("Return to title? [Press ENTER]",width/2,390);  
  
}

