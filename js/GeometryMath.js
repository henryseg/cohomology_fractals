//----------------------------------------------------------------------
//	Math Extensions
//----------------------------------------------------------------------
Math.clamp = function(input, min, max){
	return Math.max(Math.min(input, max), min);
}

Math.lerp = function(a, b, t){
  	return (1-t)*a + t*b;
}

//Takes average of a float array
Math.average = function(arr){
	var ave = 0.0;
	for(var i = 0; i < arr.length; i++) {
		ave += arr[i];
	}
	ave /= arr.length;
	return ave;
}

// Hyperbolic norm to Poincare norm.
Math.hyperbolicToPoincare = function(h){
	return Math.tanh(0.5 * h);
}

// Poincare norm to hyperbolic norm.
Math.poincareToHyperbolic = function(p){
  return 2*Math.atanh(p);
}

// Poincare norm to Klein norm.
Math.poincareToKlein = function(p){
	var mag = 2/(1+p*p);
	return p*mag;
}

// Klein norm to Poincare norm.
Math.kleinToPoincare = function(k){
  var dot = k*k;
  if(dot > 1)
    dot = 1;
	var mag = (1 - Math.sqrt( 1 - dot )) / dot;
	return k*mag;
}

// Spherical norm to steregraphic norm.
Math.sphericalToStereographic = function(s){
	return Math.tan(0.5 * s);
}

// Steregraphic norm to spherical norm.
Math.stereographicToSpherical = function(s){
  return 2 * Math.atan(s);
}

// Steregraphic norm to gnomonic norm.
Math.stereographicToGnomonic = function(s){
	var mag = 2/(1-s*s);
	return s*mag;
}

//----------------------------------------------------------------------
//	Dot Product
//----------------------------------------------------------------------
THREE.Vector4.prototype.sphericalDot = function(v){
	return this.x*v.x + this.y*v.y + this.z*v.z + this.w *v.w;
}

THREE.Vector4.prototype.lorentzDot = function(v){
	return this.x * v.x + this.y * v.y + this.z * v.z - this.w * v.w;
}

//----------------------------------------------------------------------
//	Matrix Operations
//----------------------------------------------------------------------
THREE.Matrix4.prototype.add = function (m) {
  	this.set.apply(this, [].map.call(this.elements, function (c, i) { return c + m.elements[i] }));
};

THREE.Matrix4.prototype.round = function(zeroPrecision){
	var precision = Math.pow(10, zeroPrecision);
	for(var i = 0; i<4; i++){
		for(var j = 0; j<4; j++){
			this.elements[i*4+j] = Math.round(this.elements[i*4+j] * precision ) / precision;
		}
	}
	console.log(this.elements)
}

//----------------------------------------------------------------------
//	Vector - Generators
//----------------------------------------------------------------------
function getFwdVector() {
	return new THREE.Vector3(0,0,-1);
}
function getRightVector() {
	return new THREE.Vector3(1,0,0);
}
function getUpVector() {
	return new THREE.Vector3(0,1,0);
}

// Constructs a point on the sphere from a direction and a spherical distance.
function constructSpherePoint(direction, distance){
	var w = Math.cos(distance);
	var magSquared = 1 - w * w;
	direction.normalize();
	direction.multiplyScalar(Math.sqrt(magSquared));
	return new THREE.Vector4(direction.x, direction.y, direction.z, w);
}

// Constructs a point on the hyperboloid from a direction and a hyperbolic distance.
function constructHyperboloidPoint(direction, distance){
	var w = Math.cosh(distance);
	var magSquared = w * w - 1;
	direction.normalize();
	direction.multiplyScalar(Math.sqrt(magSquared));
	return new THREE.Vector4(direction.x, direction.y, direction.z, w);
}

var halfIdealCubeWidthKlein = 0.5773502692;
var idealCubeCornerKlein = new THREE.Vector4(halfIdealCubeWidthKlein, halfIdealCubeWidthKlein, halfIdealCubeWidthKlein, 1.0);

//----------------------------------------------------------------------
//	Matrix - Generators
//----------------------------------------------------------------------
function translateByVector(v) { // trickery stolen from Jeff Weeks' Curved Spaces app
  var dx = v.x; var dy = v.y; var dz = v.z;
  var len = Math.sqrt(dx*dx + dy*dy + dz*dz);
  if( len == 0 ) 
    return new THREE.Matrix4().identity();

  dx /= len; dy /= len; dz /= len;
	var m03 = dx; var m13 = dy; var m23 = dz;
	var c1 = Math.sinh(len);
	var c2 = Math.cosh(len) - 1;

  var m = new THREE.Matrix4().set(
    0, 0, 0, m03,
    0, 0, 0, m13,
    0, 0, 0, m23,
    dx,dy,dz, 0.0);
  var m2 = new THREE.Matrix4().copy(m).multiply(m);
  m.multiplyScalar(c1);
  m2.multiplyScalar(c2);
  var result = new THREE.Matrix4().identity();
  result.add(m);
  result.add(m2);
  return result;
}

