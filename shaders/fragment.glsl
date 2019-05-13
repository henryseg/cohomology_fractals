
  vec3 convert_R2_to_ball_model_R3(vec2 p){
  float denom = p.x*p.x + p.y*p.y + 1.0; //never zero
  return vec3(2.0*p.x/denom, 2.0*p.y/denom, (-1.0 + p.x*p.x + p.y*p.y)/denom);
  }

  float R31_dot(vec4 u, vec4 v){
    return u.x*v.x + u.y*v.y + u.z*v.z - u.w*v.w; // Lorentz Dot
  }

  float R31_dist(vec4 u, vec4 v){
    float bUV = -R31_dot(u,v);
    if (bUV < 1.0) {return 0.0;}
    else {return acosh(bUV);}  
  } 

  float R31_norm_inv(vec4 v){
    return inversesqrt(abs(R31_dot(v,v)));
  }
  
  vec4 R31_normalise(vec4 u){
    return u*R31_norm_inv(u);
  }
  
  vec4 Klein_to_hyperboloid(vec3 v){
    // hyperboloid is: -w*w + x*x + y*y + z*z = -1
    // want (w, w*x, w*y, w*z) that satisfies the above
    // so w*w*(-1 + x*x + y*y + z*z) = -1
    // so w = sqrt(-1/(-1 + x*x + y*y + z*z))
    float s = 0.0;
    float temp = 1.0 / (1.0 - dot(v,v));
    if(temp >= 0.0){s = sqrt(temp);}
    return vec4(s, s*v);
  }

float param_to_isect_line_with_plane(vec4 line_start, vec4 line_dir, vec4 plane){
    float denom = R31_dot(plane, line_dir);
    if(denom == 0.0){ return 200000000.0; }  // bigger than the initial smallest_p value we will accept
    /// solve: R31_dot(plane, line_start + p * line_dir) = 0
    ///        R31_dot(plane, line_start) + p * R31_dot(plane, line_dir) = 0
    return (-R31_dot(plane, line_start)) / denom;
  }

// inf             1
//   v0 -------- v2
//    | `.    .' |
//    |   `. '   |
//    |   . `.   |
//    | .'    `. |
//   v3 -------- v1
// z               0

vec4 get_ray_dir(vec2 resolution, vec2 fragCoord){ 
    vec2 xy = 0.2*((fragCoord - 0.5*resolution)/resolution.x);
    float z = 0.1/tan(radians(fov*0.5));
    vec4 p =  R31_normalise(vec4(xy,-z,0.0));
    return p;
}

vec4 ray_trace_through_hyperboloid_tet(vec4 init_pos, vec4 init_dir, int tet_num, int entry_face, out int exit_face){
    ///Given shape of a tet and a ray, find where the ray exits and through which face
    float smallest_p = 100000000.0;
    exit_face = 1000;
    for(int face=0; face<4; face++){
        if(face != entry_face){  // find p when we hit that face
            int index = 4*tet_num + face;
            if(R31_dot(init_dir, planes[index]) > 0.0){ 
                float p = param_to_isect_line_with_plane(init_pos, init_dir, planes[index]);
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
    return R31_normalise( init_pos + smallest_p * init_dir );
}

float ray_trace(vec4 init_pt, vec4 init_dir, float dist_to_go){
    int entry_face = -1;   /// starts off with no entry face
    int tet_num = 0;
    float total_face_weight = 0.0;
    int exit_face = 0;
    vec4 new_pt;
    float dist_moved;
    int index;
    mat4 tsfm;
    vec4 new_dir;
    for(int i=0; i<maxSteps; i++){
      new_pt = ray_trace_through_hyperboloid_tet(init_pt, init_dir, tet_num, entry_face, exit_face);
      dist_moved = R31_dist(init_pt, new_pt);
      dist_to_go -= dist_moved;
      if (dist_to_go <= 0.0){ break; }
      index = 4*tet_num + exit_face;
      total_face_weight += weights[ index ];
      entry_face = entering_face_nums[ index ];
      tsfm = SO31tsfms[ index ];
      tet_num = other_tet_nums[ index ];

      new_dir = init_dir + R31_dot(init_dir, new_pt) * new_pt; // orthonormal decomp, no normalisation yet
      init_pt = new_pt * tsfm;  
      init_dir = R31_normalise( new_dir * tsfm ); 
    }
    return total_face_weight;
}

float cool_threshholds[5] = float[5](0.0, 0.25, 0.45, 0.75, 1.000001);
vec3 cool_colours[5] = vec3[5](vec3(1.0, 1.0, 1.0), vec3(0.86274, 0.92941, 0.78431), vec3(0.25882, 0.70196, 0.83529), vec3(0.10196, 0.13725, 0.49412), vec3(0.0, 0.0, 0.0));

int find_band(float t, float threshholds[5]){
    for(int j=1;j<4;j++){
        if(t < threshholds[j]){return j;}
    }
    return 4;
}

vec4 general_gradient(float t, float threshholds[5], vec3 colours[5]){
    int i = find_band(t, threshholds);
    return vec4( mix(colours[i-1], colours[i],(t - threshholds[i-1])/(threshholds[i] - threshholds[i-1]) ), 1.0);
}

#define PI 3.1415926535897932384626433832795;

void main(){
  vec4 init_pt = vec4(0.0,0.0,0.0,1.0);
  vec4 init_dir = get_ray_dir(screenResolution.xy, gl_FragCoord.xy);
  
  init_pt *= currentBoost;
  init_dir *= currentBoost; 

  float weight = ray_trace(init_pt, init_dir, maxDist);
  weight = 0.3 * weight;
  weight = 0.5 + 0.5*weight/(abs(weight) + 1.0);  //faster than atan, similar
  // weight = 0.5 + atan(0.3 * weight)/PI;  // between 0.0 and 1.0
  out_FragColor = general_gradient(weight, cool_threshholds, cool_colours);
}
