
//----------------------------------------------------------------------
//	Dot Product
//----------------------------------------------------------------------

THREE.Vector4.prototype.lorentzDot = function(v){
	return this.x * v.x + this.y * v.y + this.z * v.z - this.w * v.w;
}

THREE.Vector4.prototype.hypLength = function(){
    return Math.sqrt(Math.abs(this.lorentzDot(this)));
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

THREE.Matrix4.prototype.gramSchmidt = function(){
  var m = this.transpose(); 
  var n = m.elements; //elements are stored in column major order we need row major
  var temp = new THREE.Vector4();
  var temp2 = new THREE.Vector4();
  for (var i = 0; i<4; i++) {  ///normalize row
    var invRowNorm = 1.0 / temp.fromArray(n.slice(4*i, 4*i+4)).hypLength();
    for (var l = 0; l<4; l++) {
      n[4*i + l] = n[4*i + l] * invRowNorm;
    }
    for (var j = i+1; j<4; j++) { // subtract component of ith vector from later vectors
      var component = temp.fromArray(n.slice(4*i, 4*i+4)).lorentzDot(temp2.fromArray(n.slice(4*j, 4*j+4)));
      for (var l = 0; l<4; l++) {
        n[4*j + l] -= component * n[4*i + l];
      }
    }
  }
  m.elements = n;
  this.elements = m.transpose().elements;
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

