
//----------------------------------------------------------------------
//	Dot Product
//----------------------------------------------------------------------

THREE.Vector4.prototype.R31_dot = function(v){
	return this.x * v.x + this.y * v.y + this.z * v.z - this.w * v.w;
}

THREE.Vector4.prototype.hyp_dist = function(v){
  var bUV = -this.R31_dot(v);
  if(bUV < 1.0) {return 0.0;}
  else{ return Math.acosh(bUV);}
}

THREE.Vector4.prototype.R31_norm = function(){
    return Math.sqrt(Math.abs(this.R31_dot(this)));
}

THREE.Vector4.prototype.R31_normalise = function(){
    this.multiplyScalar(1.0/this.R31_norm());
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
    var invRowNorm = 1.0 / temp.fromArray(n.slice(4*i, 4*i+4)).R31_norm();
    for (var l = 0; l<4; l++) {
      n[4*i + l] = n[4*i + l] * invRowNorm;
    }
    for (var j = i+1; j<4; j++) { // subtract component of ith vector from later vectors
      var component = temp.fromArray(n.slice(4*i, 4*i+4)).R31_dot(temp2.fromArray(n.slice(4*j, 4*j+4)));
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

//----------------------------------------------------------------------
//  Deal with moving through tetrahedra
//----------------------------------------------------------------------

function get_pos() {
  var temp = new THREE.Matrix4().copy(g_currentBoost);
  temp.transpose(); /// THREE.js stores matrices transposed...
  return new THREE.Vector4().fromArray(temp.elements.slice(12, 16)); // last row is position
}

function isOutsideTetrahedron(v) {
  for(var i = 0; i < 4; i++){
    if( v.R31_dot( planes[4*g_tet_num + i] ) > 0.0 ){
      return true;
    }
  }
  return false; 
}

function param_to_isect_line_with_plane(line_start, line_dir, plane){
    var denom = plane.R31_dot(line_dir);
    if(denom == 0.0){ return 200000000.0; }  // bigger than the initial smallest_p value we will accept
    /// solve: R31_dot(plane, line_start + p * line_dir) = 0
    ///        R31_dot(plane, line_start) + p * R31_dot(plane, line_dir) = 0
    return (-plane.R31_dot(line_start)) / denom;
  }

function ray_trace_through_hyperboloid_tet(init_pos, init_dir, entry_face){
    ///Given shape of a tet and a ray, find where the ray exits and through which face
    var smallest_p = 100000000.0;
    var exit_face = -1;
    for(var face=0; face<4; face++){
        if(face != entry_face){  // find p when we hit that face
            var index = 4*g_tet_num + face;
            if(init_dir.R31_dot( planes[index] ) > 0.0){ 
                var p = param_to_isect_line_with_plane(init_pos, init_dir, planes[index]);
                if ((-0.00000001 <= p) && (p < smallest_p)) {
                    /// if we are on an edge then we don't in fact move as we go through this tet: t = 0.0
                    /// also allow tiny negative values, which will come up from floating point errors. 
                    /// surface normals check should ensure that even in this case we make progress through 
                    /// the triangles around an edge
                    smallest_p = p;
                    exit_face = face;
                }
            }
        }
    }
    // console.log([init_pos, init_dir, smallest_p]);
    init_pos.addScaledVector( init_dir, smallest_p ).R31_normalise(); // end_pos
    // console.log(init_pos);
    return [  init_pos, exit_face ];  
}

function fixOutsideTetrahedron() {
  var init_pos = g_last_pos;
  var init_dir = get_pos()
  init_dir.sub(init_pos).R31_normalise(); // from init_pos to pos
  var entry_face = -1;
  while (isOutsideTetrahedron(get_pos())){
      // find which face the straight line from last position to here goes through, move g_currentBoost 
      // appropriately, check again that we are inside, remember our entry face into the last tet so we don't 
      // go backwards.
      var out = ray_trace_through_hyperboloid_tet(init_pos, init_dir, entry_face);
      var exit_pos = out[0];
      var exit_face = out[1];
      var index = 4*g_tet_num + exit_face;
      entry_face = entering_face_nums[ index ];
      var tsfm = SO31tsfms[ index ];
      console.log(exit_face);  // can crash on this being -1...
      g_tet_num = other_tet_nums[ index ];
      g_material.uniforms.tetNum.value = g_tet_num;
      g_currentWeight += weights[ index ];
      g_material.uniforms.currentWeight.value = g_currentWeight;
      g_currentBoost.multiply(tsfm);

      init_dir.addScaledVector( exit_pos, init_dir.R31_dot(exit_pos)).applyMatrix4(tsfm).R31_normalise();
      exit_pos.applyMatrix4(tsfm); 
      init_pos = exit_pos;
      console.log(g_tet_num);
  }
  g_last_pos = get_pos();
}
