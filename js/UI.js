//-------------------------------------------------------
// Global Variables
//-------------------------------------------------------

var g_targetFPS = {value:27.5};

//-------------------------------------------------------
// UI Variables
//-------------------------------------------------------

var guiInfo;

// Inputs are from the UI parameterizations.
// gI is the guiInfo object from initGui
function updateUniformsFromUI()
{

  var maxDist = 10.0;
  // if( g_geometry == Geometry.Euclidean )
  //   maxDist = 50.0; // Needs to be larger for euclidean.
  // if( g_geometry == Geometry.Spherical )
  //   maxDist = Math.PI; // Only go to antipode.

  // initGenerators(p,q,r);
  // initLights(g_geometry);
  // g_material.uniforms.lightPositions.value = lightPositions;
  // g_material.uniforms.lightIntensities.value = lightIntensities;
  // initObjects(g_geometry);
  // g_material.uniforms.globalObjectBoost.value = globalObjectBoost;
  // g_material.uniforms.globalObjectRadius.value = globalObjectRadius;
  
  // g_material.uniforms.geometry.value = g;
  // g_material.uniforms.invGenerators.value = invGens;
  // g_material.uniforms.halfCubeDualPoints.value = hCDP;
  // g_material.uniforms.halfCubeWidthKlein.value = hCWK;
  // g_material.uniforms.cut1.value = g_cut1;
  // g_material.uniforms.cut4.value = g_cut4;
  // g_material.uniforms.tubeRad.value = g_tubeRad;
  // g_material.uniforms.cellPosition.value = g_cellPosition;
  // g_material.uniforms.cellSurfaceOffset.value = g_cellSurfaceOffset;
  // g_material.uniforms.vertexPosition.value = g_vertexPosition;
  // g_material.uniforms.vertexSurfaceOffset.value = g_vertexSurfaceOffset;
  // g_material.uniforms.attnModel.value = guiInfo.falloffModel;
  g_material.uniforms.maxDist.value = maxDist;

  // g_material.uniforms.useSimplex.value = !isCubical;
  // g_material.uniforms.simplexMirrorsKlein.value = simplexMirrors;
  // g_material.uniforms.simplexDualPoints.value = simplexDualPoints;
}

//What we need to init our dat GUI
var initGui = function(){
  guiInfo = { //Since dat gui can only modify object values we store variables here.
    sceneIndex: 0,
    toggleUI: true,
    p:4,
    q:3,
    r:6,
    edgeThickness:1.5,
    eToHScale:1.0,
    fov:90,
    toggleStereo:false,
    rotateEyes:false,
    autoSteps:true,
    maxSteps: 31,
    halfIpDistance: 0.03200000151991844,
    falloffModel: 1,
    renderShadows: 0,
    shadowSoftness: 0,
    screenshotWidth: g_screenShotResolution.x,
    screenshotHeight: g_screenShotResolution.y,
    resetPosition: function(){
      g_currentBoost.identity();
      g_cellBoost.identity();
      g_invCellBoost.identity();
      g_controllerBoosts[0].identity();
    },
    TakeSS: function(){
      takeScreenshot();
    }
  };

  var gui = new dat.GUI();
  gui.close();
  //scene settings ---------------------------------
  var sceneController = gui.add(guiInfo, 'sceneIndex',{Simplex_cuts: 0, Edge_tubes: 1, Medial_surface: 2, Cube_planes: 3}).name("Scene");
  var pController = gui.add(guiInfo, 'p', {"3":3, "4":4, "5":5, "6":6, "7":7, "8":8, "9":9, "10":10, "11":11, "12":12, "30":30}).name("P");
  var qController = gui.add(guiInfo, 'q', {"3":3, "4":4, "5":5, "6":6, "7":7, "8":8, "9":9, "10":10, "11":11, "12":12, "30":30}).name("Q");
  var rController = gui.add(guiInfo, 'r', {"3":3, "4":4, "5":5, "6":6, "7":7, "8":8, "9":9, "10":10, "11":11, "12":12, "30":30}).name("R");
  var thicknessController = gui.add(guiInfo, 'edgeThickness', 0, 5).name("Edge Thickness");
  var scaleController = gui.add(guiInfo, 'eToHScale', 0.25,4).name("Euclid To Hyp");
  var fovController = gui.add(guiInfo, 'fov',40,180).name("FOV");
  var lightFalloffController = gui.add(guiInfo, 'falloffModel', {InverseLinear: 1, InverseSquare:2, InverseCube:3, Physical: 4, None:5}).name("Light Falloff");
  var shadowController = gui.add(guiInfo, 'renderShadows', {NoShadows: 0, Local: 1, Global: 2, LocalAndGlobal: 3}).name("Shadows");
  var softnessController = gui.add(guiInfo, 'shadowSoftness', 0,0.25).name("Shadow Softness");
  gui.add(guiInfo, 'resetPosition').name("Reset Position");
  var screenshotFolder = gui.addFolder('Screenshot');
  var widthController = screenshotFolder.add(guiInfo, 'screenshotWidth');
  var heightController = screenshotFolder.add(guiInfo, 'screenshotHeight');
  screenshotFolder.add(guiInfo, 'TakeSS').name("Take Screenshot");
  //debug settings ---------------------------------
  var debugFolder = gui.addFolder('Debug');
  var stereoFolder = debugFolder.addFolder('Stereo');
  var debugUIController = debugFolder.add(guiInfo, 'toggleUI').name("Toggle Debug UI");
  debugFolder.add(guiInfo, 'autoSteps').name("Auto Adjust Step Count");
  debugFolder.add(guiInfo, 'maxSteps', 0, 127).name("Set Step Count");
  debugFolder.add(g_targetFPS, 'value', 15, 90).name("Target FPS");
  var switchToStereo = stereoFolder.add(guiInfo, 'toggleStereo').name("Toggle Stereo");
  var rotateController = stereoFolder.add(guiInfo, 'rotateEyes').name("Rotate Eyes");
  var pupilDistanceController = stereoFolder.add(guiInfo, 'halfIpDistance').name("Interpupiliary Distance");

  // ------------------------------
  // UI Controllers
  // ------------------------------
  widthController.onFinishChange(function(value){
    g_screenShotResolution.x = value;
  });

  heightController.onFinishChange(function(value){
    g_screenShotResolution.y = value;
  })

  lightFalloffController.onFinishChange(function(value){
    updateUniformsFromUI();
  });

  shadowController.onFinishChange(function(value){
    if(value == 0){
      g_material.uniforms.renderShadows.value[0] = false;
      g_material.uniforms.renderShadows.value[1] = false;
    }
    else if(value == 1){ //Local
      g_material.uniforms.renderShadows.value[0] = true;
      g_material.uniforms.renderShadows.value[1] = false;
    }
    else if(value == 2){ //Global
      g_material.uniforms.renderShadows.value[0] = false;
      g_material.uniforms.renderShadows.value[1] = true;
    }
    else{ //Local and Global
      g_material.uniforms.renderShadows.value[0] = true;
      g_material.uniforms.renderShadows.value[1] = true;
    }
  });

  softnessController.onChange(function(value){
    if(value === 0.0){
      g_material.uniforms.shadSoft.value = 128.0;
    }
    else{
      g_material.uniforms.shadSoft.value = 1.0/value;
    }
  });

  pController.onFinishChange(function(value) {
	  updateUniformsFromUI();
  });

  qController.onFinishChange(function(value) {
	  updateUniformsFromUI();
  });

  rController.onFinishChange(function(value) {
	  updateUniformsFromUI();
  });

  thicknessController.onChange(function(value) {
	  updateUniformsFromUI();
  });

  scaleController.onFinishChange(function(value) {
    updateEyes();
  });

  fovController.onChange(function(value){
    g_material.uniforms.fov.value = value;
  });

  debugUIController.onFinishChange(function(value){
    var crosshair = document.getElementById("crosshair");
    var crosshairLeft = document.getElementById("crosshairLeft");
    var crosshairRight = document.getElementById("crosshairRight");
    var fps = document.getElementById("fps");
    var about = document.getElementById("about");
    if(value){
      about.style.visibility = 'visible';
      fps.style.visibility = 'visible';
      if(guiInfo.toggleStereo){
        crosshairLeft.style.visibility = 'visible';
        crosshairRight.style.visibility = 'visible';
      }
      else
        crosshair.style.visibility = 'visible';
    }
    else{
      about.style.visibility = 'hidden';
      fps.style.visibility = 'hidden';
      crosshair.style.visibility = 'hidden';
      crosshairLeft.style.visibility = 'hidden';
      crosshairRight.style.visibility = 'hidden';
    }
  });

  switchToStereo.onFinishChange(function(value){
    var crosshair = document.getElementById("crosshair");
    var crosshairLeft = document.getElementById("crosshairLeft");
    var crosshairRight = document.getElementById("crosshairRight");
    if(guiInfo.toggleUI){
      if(value){
        g_material.uniforms.isStereo.value = 1;
        crosshairLeft.style.visibility = 'visible';
        crosshairRight.style.visibility = 'visible';
        crosshair.style.visibility = 'hidden';
      }
      else{
        g_material.uniforms.isStereo.value = 0;
        g_material.uniforms.screenResolution.value.x = window.innerWidth;
        g_material.uniforms.screenResolution.value.y = window.innerHeight;
        crosshairLeft.style.visibility = 'hidden';
        crosshairRight.style.visibility = 'hidden';
        crosshair.style.visibility = 'visible';
      }
    }
  });

  pupilDistanceController.onFinishChange(function(value){
    updateEyes();
  });

  rotateController.onFinishChange(function(value) {
    updateEyes();
  });

  sceneController.onFinishChange(function(index){
	  var geoFrag = getGeometryFrag();
    g_material.needsUpdate = true;
    g_material.fragmentShader = globalsFrag.concat(lightingFrag).concat(geoFrag).concat(scenesFrag[index]).concat(mainFrag);
  });
}