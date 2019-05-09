//-------------------------------------------------------
// Global Variables
//-------------------------------------------------------
var g_effect;
var g_material;
var g_controls;
var g_geometry;
var g_rotation;
var g_currentBoost;
var g_stereoBoosts = [];
// var g_cellBoost;
// var g_invCellBoost;
var g_screenResolution;
var g_screenShotResolution;
var g_controllerBoosts = [];
var g_controllerDualPoints = [];

//-------------------------------------------------------
// Scene Variables
//-------------------------------------------------------
var scene;
var renderer;
var camera;
// var maxSteps = 50;
// var maxDist = 10.0;
var textFPS;
var time;
var stats;

//-------------------------------------------------------
// FPS Manager
//-------------------------------------------------------
var m_stepDamping = 0.75;
var m_stepAccum = 0;
var fpsLog = new Array(10);
fpsLog.fill(g_targetFPS.value);


//-------------------------------------------------------
// Sets up the scene
//-------------------------------------------------------
var init = function(){
  if(WEBGL.isWebGL2Available() === false){
    document.body.appendChild(WEBGL.getWebGL2ErrorMessage());
  }
  else{
    //Setup our THREE scene--------------------------------
	  time = Date.now();
	  textFPS = document.getElementById('fps');
    scene = new THREE.Scene();
    var canvas  = document.createElement('canvas');
    var context = canvas.getContext('webgl2');
    renderer = new THREE.WebGLRenderer({canvas: canvas, context: context});
    document.body.appendChild(renderer.domElement);
    g_screenResolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    g_screenShotResolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    g_effect = new THREE.VREffect(renderer);
    camera = new THREE.OrthographicCamera(-1,1,1,-1,1/Math.pow(2,53),1);
    g_controls = new THREE.Controls();
    g_rotation = new THREE.Quaternion();
    g_controllerBoosts.push(new THREE.Matrix4());
    g_controllerBoosts.push(new THREE.Matrix4());
    g_currentBoost = new THREE.Matrix4(); // boost for camera relative to central cell
	  // initGenerators(4,3,6);
	  //We need to load the shaders from file
    //since web is async we need to wait on this to finish
    loadShaders();
  }

  stats = new Stats(); stats.showPanel(1); stats.showPanel(2); stats.showPanel(0); document.body.appendChild(stats.dom);

}

var globalsFrag;
var mainFrag;

var loadShaders = function(){ //Since our shader is made up of strings we can construct it from parts
  var loader = new THREE.FileLoader();
  loader.setResponseType('text');
  loader.load('shaders/fragment.glsl',function(main){
      // loader.load('shaders/hyperbolic.glsl', function(hyperbolic){
          loader.load('shaders/globalsInclude.glsl', function(globals){
          //pass full shader string to finish our init
          globalsFrag = globals;
          mainFrag = main;
          finishInit(globals.concat(main));
        // });
    });
  });
  
}

var finishInit = function(fShader){
//  console.log(fShader);
  g_material = new THREE.ShaderMaterial({
    uniforms:{
      // isStereo:{type: "i", value: 0},
      // geometry:{type: "i", value: 3},
      screenResolution:{type:"v2", value:g_screenResolution},
      fov:{type:"f", value:90},
      // invGenerators:{type:"m4v", value:invGens},
      currentBoost:{type:"m4", value:g_currentBoost},
      // stereoBoosts:{type:"m4v", value:g_stereoBoosts},
      // cellBoost:{type:"m4", value:g_cellBoost},
      // invCellBoost:{type:"m4", value:g_invCellBoost},
      // maxSteps:{type:"i", value:maxSteps},
      // maxDist:{type:"f", value:maxDist},
			// lightPositions:{type:"v4v", value:lightPositions},
      // lightIntensities:{type:"v3v", value:lightIntensities},
      // attnModel:{type:"i", value:attnModel},
      // renderShadows:{type:"bv", value:[false, false]},
      // shadSoft:{type:"f", value:128.0},
      // tex:{type:"t", value: new THREE.TextureLoader().load("images/concrete2.png")},
      // tex:{type:"t", value: new THREE.TextureLoader().load("images/white.png")},   
      controllerCount:{type:"i", value: 0},
      controllerBoosts:{type:"m4", value:g_controllerBoosts},
      // globalObjectBoost:{type:"m4v", value:globalObjectBoost},
      // globalObjectRadius:{type:"v3v", value:globalObjectRadius},
			// halfCubeDualPoints:{type:"v4v", value:hCDP},
      // halfCubeWidthKlein:{type:"f", value: hCWK},
      // cut1:{type:"i", value:g_cut1},
	  	// cut4:{type:"i", value:g_cut4},
      // tubeRad:{type:"f", value:g_tubeRad},
      // cellPosition:{type:"v4", value:g_cellPosition},
      // cellSurfaceOffset:{type:"f", value:g_cellSurfaceOffset},
      // vertexPosition:{type:"v4", value:g_vertexPosition},
      // vertexSurfaceOffset:{type:"f", value:g_vertexSurfaceOffset},
      // useSimplex:{type:"b", value:false},
      // simplexMirrorsKlein:{type:"v4v", value:simplexMirrors},
      // simplexDualPoints:{type:"v4v", value:simplexDualPoints}
    },
    // defines: {
    //   // NUM_LIGHTS: lightPositions.length,
    // },
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: fShader,
    transparent:true
  });

  g_effect.setSize(g_screenResolution.x, g_screenResolution.y);
  //Setup dat GUI --- SceneManipulator.js
  initGui();

  //Setup a "quad" to render on-------------------------
  var geom = new THREE.BufferGeometry();
  var vertices = new Float32Array([
    -1.0, -1.0, 0.0,
     1.0, -1.0, 0.0,
     1.0,  1.0, 0.0,

    -1.0, -1.0, 0.0,
     1.0,  1.0, 0.0,
    -1.0,  1.0, 0.0
  ]);
  geom.addAttribute('position',new THREE.BufferAttribute(vertices,3));
  var mesh = new THREE.Mesh(geom, g_material);
  scene.add(mesh);

  animate();
}

//-------------------------------------------------------
// Where our scene actually renders out to screen
//-------------------------------------------------------
var animate = function(){
  stats.begin();
  // maxSteps = calcMaxSteps(fps.getFPS(), maxSteps);
  // g_material.uniforms.maxSteps.value = maxSteps;
  
  g_controls.update();
  THREE.VRController.update();
  
  //console.log(g_currentBoost.elements);

  g_effect.render(scene, camera, animate);
  stats.end();
}

//-------------------------------------------------------
// Where the magic happens
//-------------------------------------------------------
if(mobileCheck()){
  window.location.replace("http://www.michaelwoodard.net/hypVR-Ray_m/")
}
else{
  init();
}