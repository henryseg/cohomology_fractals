
  vec3 convert_R2_to_ball_model_R3(vec2 p){
  float denom = p.x*p.x + p.y*p.y + 1.0; //never zero
  return vec3(2.0*p.x/denom, 2.0*p.y/denom, (-1.0 + p.x*p.x + p.y*p.y)/denom);
  }

  float R13_dot(vec4 u, vec4 v){
    return -u.x*v.x + u.y*v.y + u.z*v.z + u.w*v.w; // Lorentz Dot
  }

  float R13_dist(vec4 u, vec4 v){
    float bUV = -R13_dot(u,v);
    if (bUV < 1.0) {return 0.0;}
    else {return acosh(bUV);}  
  } 

  float R13_norm(vec4 v){
    return sqrt(abs(R13_dot(v,v)));
  }
  
  vec4 R13_normalise(vec4 u){
    return u/R13_norm(u);
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
    float denom = R13_dot(plane, line_dir);
    if(denom == 0.0){ return 200000000.0; }  // bigger than the initial smallest_p value we will accept
    /// solve: R13_dot(plane, line_start + p * line_dir) = 0
    ///        R13_dot(plane, line_start) + p * R13_dot(plane, line_dir) = 0
    return (-R13_dot(plane, line_start)) / denom;
  }

// inf             1
//   v0 -------- v2
//    | `.    .' |
//    |   `. '   |
//    |   . `.   |
//    | .'    `. |
//   v3 -------- v1
// z               0

int other_tet_nums[8] = int[8](1,1,1,1,0,0,0,0);
int entering_face_nums[8] = int[8](1,2,0,3,2,0,1,3);
float weights[8] = float[8](1.0,0.0,1.0,0.0,-1.0,-1.0,0.0,0.0);
mat4 SO13tsfms[8] = mat4[8](
  mat4(2.5, -1.5000000000000002, -0.8660254037844385, 1.5, 1.5, -0.5000000000000001, -0.8660254037844385, 1.5, 0.8660254037844385, -0.8660254037844385, 0.5000000000000001, 0.8660254037844385, 1.5000000000000002, -1.5000000000000002, -0.8660254037844385, 0.5),
  mat4(1.4999999999999998, -0.49999999999999994, -0.8660254037844385, -0.4999999999999998, -0.5000000000000002, 1.0, 3.885780586188048e-16, 0.5000000000000002, 0.8660254037844383, 3.885780586188048e-16, -1.0, -0.8660254037844383, -0.49999999999999983, 0.49999999999999994, 0.8660254037844385, -0.5000000000000002),
  mat4(1.9999999999999996, 2.220446049250314e-16, -1.7320508075688767, 4.440892098500628e-16, 1.4999999999999993, 2.220446049250314e-16, -1.7320508075688767, -0.4999999999999998, 0.8660254037844387, 0.0, -1.0, 0.8660254037844387, -1.110223024625157e-16, -1.0, 0.0, -1.110223024625157e-16),
  mat4(1.5, -1.0, 0.0, 0.5, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, -0.5, 1.0, 0.0, 0.5),
  mat4(1.9999999999999996, -1.4999999999999993, -0.8660254037844388, 0.0, -2.2204460492503126e-16, 2.2204460492503126e-16, 1.1102230246251563e-16, -1.0, 1.7320508075688767, -1.7320508075688767, -1.0, -1.1102230246251563e-16, -4.440892098500625e-16, -0.4999999999999999, 0.8660254037844388, 0.0),
  mat4(2.5000000000000004, -1.5, -0.8660254037844389, -1.5000000000000007, 1.5000000000000007, -0.5000000000000001, -0.8660254037844388, -1.5000000000000007, 0.8660254037844388, -0.8660254037844388, 0.5000000000000001, -0.8660254037844388, -1.5000000000000002, 1.5, 0.8660254037844389, 0.5000000000000003),
  mat4(1.4999999999999998, 0.5000000000000002, -0.8660254037844383, 0.5000000000000001, 0.5000000000000001, 1.0, 2.7755575615628914e-16, 0.5000000000000001, 0.8660254037844386, 2.7755575615628914e-16, -1.0, 0.8660254037844386, 0.49999999999999967, 0.5000000000000002, -0.8660254037844383, -0.5000000000000001),
  mat4(1.5, -1.0, 0.0, 0.5, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, -0.5, 1.0, 0.0, 0.5)
  );  /// matrices are in 1,3 signature...

vec4 planes[4] = vec4[4](
    vec4(0.8660254037844389, 0.8660254037844389, 0.4999999999999998, -0.8660254037844389), 
    vec4(0.8660254037844387, 0.8660254037844387, 0.5, 0.8660254037844387), 
    vec4(0.0, -0.8660254037844387, 0.5000000000000001, -0.0), 
    vec4(0.0, -0.0, -1.0, -0.0) 
    );  /// planes are in 1,3 signature... so x,y,z,w means that x is the -1...

vec4 ray_trace_through_hyperboloid_tet(vec4 init_pos, vec4 init_dir, int entry_face, out int exit_face){
    ///Given shape of a tet and a ray, find where the ray exits and through which face
    float smallest_p = 100000000.0;
    exit_face = 1000;
    for(int face=0; face<4; face++){
        if(face != entry_face){  // find p when we hit that face
            if(R13_dot(init_dir, planes[face]) > 0.0){ 
                float p = param_to_isect_line_with_plane(init_pos, init_dir, planes[face]);
                // float p = 1.0;
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

    return R13_normalise( init_pos + smallest_p * init_dir );
}

vec4 get_ray_dir(vec2 resolution, vec2 fragCoord){ 
    vec2 xy = 0.2*((fragCoord - 0.5*resolution)/resolution.x);
    float z = 0.1/tan(radians(fov*0.5));
    vec4 p =  R13_normalise(vec4(xy,-z,0.0));
    return p;
}

float ray_trace(vec4 init_pt, vec4 init_dir, float dist_to_go){
    // float dist_to_go = R13_dist(start_pt, pixel_pt);
    // vec4 diff = pixel_pt - start_pt;
    // vec4 init_dir = R13_normalise( (diff) + R13_dot(diff, start_pt) * start_pt );  // orthonormal decomp
    // vec4 init_pt = start_pt;
    int entry_face = -1;   /// starts off with no entry face
    int tet_num = 0;
    float total_face_weight = 0.0;
    int exit_face = 0;
    vec4 new_pt;
    float dist_moved;
    int index;
    mat4 tsfm;
    vec4 new_dir;
    for(int i=0; i<100; i++){
      new_pt = ray_trace_through_hyperboloid_tet(init_pt, init_dir, entry_face, exit_face);
      dist_moved = R13_dist(init_pt, new_pt);
      dist_to_go -= dist_moved;
      if (dist_to_go <= 0.0){ break; }
      index = 4*tet_num + exit_face;
      total_face_weight += weights[ index ];
      entry_face = entering_face_nums[ index ];
      tsfm = SO13tsfms[ index ];
      tet_num = other_tet_nums[ index ];

      new_dir = init_dir + R13_dot(init_dir, new_pt) * new_pt; // orthonormal decomp, no normalisation yet
      init_pt = new_pt * tsfm;  
      init_dir = R13_normalise( new_dir * tsfm ); 
    }
    return total_face_weight;
}

vec3 mymix(vec3 col0, vec3 col1, float t){
  return (1.0-t)*col0 + t*col1;
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
  // vec2 p = vec2(2.0*gl_FragCoord.x/screenResolution.x - 1.0, (2.0*gl_FragCoord.y - screenResolution.y)/screenResolution.x);
  /// square aspect ratio, [-1,1] x [-h,h]
  // p = 0.03*p; // + vec2(0.3,0.0);
  // vec4 pt = Klein_to_hyperboloid( 0.999999 * convert_R2_to_ball_model_R3(p) );
  // vec4 start_pt = vec4(1.1094003924504583, 0.41602514716892186, 0.24019223070763074, 0.0);
  // float weight = ray_trace_to_a_point(pt, start_pt);
  vec4 init_pt = vec4(0.0,0.0,0.0,1.0);
  vec4 init_dir = get_ray_dir(screenResolution.xy, gl_FragCoord.xy);
  
  init_pt *= currentBoost;
  init_dir *= currentBoost; 
  /// and now, our own bigendian/littleendian horror
  init_pt = vec4(init_pt.w, init_pt.xyz);
  init_dir = vec4(init_dir.w, init_dir.xyz);

  float weight = ray_trace(init_pt, init_dir, 7.5);
  weight = 0.5 + atan(0.3 * weight)/PI;  // between 0.0 and 1.0
  out_FragColor = general_gradient(weight, cool_threshholds, cool_colours);
  // out_FragColor = vec4(gl_FragCoord.x/screenResolution.x,0.0,0.0,1.0);
  // out_FragColor = general_gradient(gl_FragCoord.x/screenResolution.x, cool_threshholds, cool_colours);
}
