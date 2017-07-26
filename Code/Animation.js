//==============================================================================
//ANIMPLAYER OBJECT
//Maintains information about the currently active animations
//==============================================================================
function AnimPlayer(){
  this.Animations = [];
  this.update = function(){
    for(var i = 0; i < this.Animations.length; i++){
      if(this.Animations[i].finished){
        this.Animations.splice(i,1);
        i--;
        continue;
      }
      this.Animations[i].update();
    }
  }
  this.addAnim = function(anim){
    this.Animations.push(anim);
  }
}
//==============================================================================
//ANIMATION OBJECT
//Maintains information about an object and its current animation
//Rotation interpolation is always slerp
//Arguments:
//object - object to apply the animation to
//trans - destination transform
//speed - animation playback speed, in % per second
//looping - boolean for whether to loop the animation.
//Flags:
var ANIM_PSR = 0b00000000111;
var ANIM_POS = 0b00000000001;
//0b0000000001 - animate position
var ANIM_SCALE =  0b00000000010;
//0b0000000010 - animate scale
var ANIM_ROT =    0b00000000100;
//0b0000000100 - animate rotation
var INT_LINE =    0b00000001000;
//0b0000001000 - linear interpolation
var INT_BEZ =     0b00000010000;
//0b0000010000 - bezier interpolation
var INT_HERM =    0b00000100000;
//0b0000100000 - hermite interpolation
var MULTI =       0b00001000000;
//0b0001000000 - multiple objects
var REPEAT =      0b00010000000;
//0b0010000000 - loop indefinitely
var BOUNCE =      0b00100000000;
//0b0100000000 - Reverse animation when it reaches the end
var CIRCULAR =    0b01000000000;
//0b0100000000 - similar to loop but will repeat starting at -1.0 percent
var REVERSED =    0b10000000000;
//0b1000000000 - reverses direction of motion
//In the case that non linear interpolation is used, trans is expected to be an array of 3 transforms
//In the case that MULTI is true, object is expected to be an array of objects
//==============================================================================
function Animation(object, trans, speed, flags, count = 1){
  this.Object = object;
  this.destTrans = trans;
  this.speed = speed;
  this.count = count;
  if(!(flags&CIRCULAR) && (flags&REVERSED)){this.curCount = -1;}
  else{this.curCount = 0;}
  this.circular = (flags&CIRCULAR);
  this.loop = (flags&REPEAT);
  this.bounce = (flags&BOUNCE);
  if(flags&REVERSED){this.direction = -1; this.reversed = true}
  else{this.direction = 1; this.reversed = false;}
  this.initTrans = [];
  this.percent = 0.0;
  this.finished = false;
  this.upTick = true;
  //Cache initial transforms
  if(flags&MULTI){
    for(var i = 0; i < object.length; i++){
      this.initTrans.push(new Transform(object[i].transform.position, object[i].transform.scale, object[i].transform.rotation));
    }
  }
  else{
    this.initTrans = new Transform(object.transform.position, object.transform.scale, object.transform.rotation);
    if(flags&INT_LINE){
      this.update = function(){
        if(this.percent > 1.00){
          if(this.circular){
            this.percent = -1.00;
            this.upTick = false;
          }
          else if(this.bounce){
            this.direction = this.direction*-1;
          }
          else if (this.loop || this.curCount < this.count) {
            this.percent = this.percent%1.00;
            this.curCount++;
          }
          else{
            this.finished = true;
          }
        }
        else if (this.percent < -1.00) {
          if(this.circular){
            this.percent = 1.00;
            this.upTick = false;
          }
          else{
            this.finished = true;
          }
        }
        else if ((!this.reversed && !this.upTick && this.percent > 0.00)||(this.reversed && !this.upTick && this.percent < 0.00)) {
          if(this.loop || this.curCount<this.count){
            this.upTick = true;
            this.curCount++;
          }
          else {
            this.finished = true;
          }
        }
        else if(this.percent < 0.00){
          if(this.circular){
            //do nothing since we want to go to -1.00
          }
          else if(this.loop && this.bounce){
            this.direction = this.direction*-1;
            this.percent = 0.00001;
            this.curCount++;
          }
          else if (this.loop || this.curCount < this.count) {
            this.percent = 1.00;
            this.curCount++;
          }
          else{
            this.finished = true;
          }
        }
        if(this.curCount == this.count && !this.loop){
          this.finished = true;
        }
        if(!this.finished){
          //Compute percent done
          var addPercent = (this.speed*(Engine.TimeKeeper.deltaTime/1000))/100;
          this.percent += this.direction * addPercent;
          //Apply animations if enabled
          if(flags&ANIM_POS){
            vec3.lerp(this.Object.transform.position, this.initTrans.position, this.destTrans.position, this.percent);
          }
          if(flags&ANIM_SCALE){
            vec3.lerp(this.Object.transform.scale, this.initTrans.scale, this.destTrans.scale, this.percent);
          }
          if(flags&ANIM_ROT){
            quat.slerp(this.Object.transform.rotation, this.initTrans.rotation, this.destTrans.rotation, this.percent);
          }
        }
      }
    }
    else if(flags&INT_BEZ){
      this.update = function(){

      }
    }
    else if(flags&INT_HERM){
      this.update = function(){

      }
    }
    else{
      console.log("No valid animation flag provided.");
    }
  }
}
