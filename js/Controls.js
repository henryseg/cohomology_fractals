/**
 * Based off code created by:
 * dmarcos / https://github.com/dmarcos
 * hawksley / https://github.com/hawksley 
 */

THREE.Controls = function(done){
    var speed = 0.2;
    this._oldVRState;
    this.defaultPosition = new THREE.Vector3();
    this.manualRotation = new THREE.Quaternion();
    this.manualRotateRate = new Float32Array([0.0, 0.0, 0.0]);
    this.manualMoveRate = new Float32Array([0.0, 0.0, 0.0]);
    this.updateTime = 0;
    
    this.manualControls = {
        37 : {index: 1, sign: 1, active: 0},  // left arrow - yaw left
        39 : {index: 1, sign: -1, active: 0}, // right arrow - yaw right
        38 : {index: 0, sign: 1, active: 0},  // up arrow - pitch up
        40 : {index: 0, sign: -1, active: 0}, // down arrow - pitch down
        90 : {index: 2, sign: -1, active: 0}, // z - roll left
        88 : {index: 2, sign: 1, active: 0},  // x - roll right
        87 : {index: 3, sign: 1, active: 0},  // w - forward
        83 : {index: 3, sign: -1, active: 0}, // s - backward
        65 : {index: 4, sign: -1, active: 0}, // a - strafe left
        68 : {index: 4, sign: 1, active: 0},   // d - strafe right
        69 : {index: 5, sign: 1, active: 0}, // e - strafe up
        67 : {index: 5, sign: -1, active: 0},   // c - strafe down
    };
    
    this._init = function(){
        var self = this;
        this._oldVRState = undefined;
        if(!navigator.getVRDisplays && !navigator.mozGetVRDevices && !navigator.getVRDevices) 
            return;
        if(navigator.getVRDisplays)
            navigator.getVRDisplays().then(gotVRDisplay);
        else if(navigator.getVRDevices)
            navigator.getVRDevices().then(gotVRDevices);
        else
            navigator.mozGetVRDevices(gotVRDevices);

        function gotVRDisplay(devices){
            var vrInput;
            var error;
            for(var i = 0; i < devices.length; i++){
                if(devices[i] instanceof VRDisplay){
                    vrInput = devices[i];
                    self._vrInput = vrInput;
                    break;
                }
            }
        }

        function gotVRDevices(devices){
            var vrInput;
            var error;
            for(var i = 0; i < devices.length; i++){
                if(devices[i] instanceof PositionSensorVRDevice){
                    vrInput = devices[i];
                    self._vrInput = vrInput;
                    break;
                }
            }
        }
    };

    this._init();

    this.update = function(){
        var vrState = this.getVRState();
        var manualRotation = this.manualRotation;
        var oldTime = this.updateTime;
        var newTime = Date.now();
        this.updateTime = newTime;


        //--------------------------------------------------------------------
        // Translation
        //--------------------------------------------------------------------
        //TODO: Beautify
        // var deltaTime = (newTime - oldTime) * 0.001;
        // var deltaPosition = new THREE.Vector3();
        // if(vrState !== null && vrState.hmd.lastPosition !== undefined && vrState.hmd.position[0] !== 0){
        //     var quat = vrState.hmd.rotation.clone().inverse();
        //     deltaPosition = new THREE.Vector3().subVectors(vrState.hmd.position, vrState.hmd.lastPosition).applyQuaternion(quat);
        // }

        // var controllerMove = 0;
        // if(g_controllerMove){ controllerMove = 1; }

        // if(this.manualMoveRate[0] !== 0 || this.manualMoveRate[1] !== 0 || this.manualMoveRate[2] !== 0 || controllerMove !== 0){
        //     deltaPosition = getFwdVector().multiplyScalar(speed * deltaTime * (this.manualMoveRate[0] + controllerMove)).add(
        //         getRightVector().multiplyScalar(speed  * deltaTime * this.manualMoveRate[1])).add(
        //         getUpVector().multiplyScalar(speed  * deltaTime * this.manualMoveRate[2]));
        // }
        // if(deltaPosition !== undefined){
        //     deltaPosition.multiplyScalar(guiInfo.eToHScale);
        //     var m = translateByVector(deltaPosition);
        //     // console.log(m);
        //     g_currentBoost.premultiply(m);
        // }

        // update g_currentBoost

        // var t = g_framenumber / g_num_frames;  // goes from 0 to 1 in g_num_frames
        var t = ( (Date.now() - g_starttime) % (20 * g_num_frames) ) / (20 * g_num_frames);
        // 20 == 1000/fps = 1000/50, since Date.now() is in milliseconds

        // var t = 0;
        // console.log(t);

        var param = 0.5 + 0.5*(-Math.cos(Math.PI*t)); // goes from 0 to 1 in g_num_frames, smoothed
        var param2 = 0.5 + 0.5*(-Math.cos(2*Math.PI*t)); // goes from 0 to 1 to 0 in num_frames, smoothed
        // var t2 = 2*Math.abs((t%1.0) - 0.5);
        var t2 = 4*(t%1.0)*(1-(t%1.0));

        // var position = new THREE.Vector3(0, 0, 2*cos_t);
        // var position = new THREE.Vector3(0, 0, Math.log(Math.sqrt(128)));
        // var position = new THREE.Vector3(0, 0, -Math.log(Math.sqrt(512)));
        var init_d = Math.log(Math.sqrt(128));
        var term_d = -Math.log(Math.sqrt(512));
        var position = new THREE.Vector3(0, 0, init_d*(1-param) + term_d*param);

        g_currentBoost.copy(translateByVector(position));

        var z_rotation = new THREE.Matrix4().makeRotationZ(Math.PI/4 + param*Math.PI/2);
        g_currentBoost.premultiply(z_rotation);


        // var rotation = new THREE.Matrix4().makeRotationY(Math.PI);
        // g_currentBoost.premultiply(rotation);

        // console.log(g_currentBoost);
  
        // (for now, don't expect to leave the tetrahedron)

        // fix things if we are outside of our tetrahedron...
        // fixOutsideTetrahedron();

        // var maxDist = Math.exp(1.23 + 0.9*param2);  // get out near the true cohom frac
        var maxDist = Math.exp(1.23 + 0.1*param2);  // don't go out as far
        g_material.uniforms.maxDist.value = maxDist;

        g_material.uniforms.contrast.value = Math.exp(8*(1-Math.pow(t2, 0.33)));

        //--------------------------------------------------------------------
        // Rotation
        //--------------------------------------------------------------------
        // var deltaRotation = new THREE.Quaternion(this.manualRotateRate[0] * speed * deltaTime,
        //                                          this.manualRotateRate[1] * speed * deltaTime,
        //                                          this.manualRotateRate[2] * speed * deltaTime, 1.0);
        // deltaRotation.normalize();
        // if(deltaRotation !== undefined){
        //     g_rotation.multiply(deltaRotation);
        //     m = new THREE.Matrix4().makeRotationFromQuaternion(deltaRotation.inverse());
        //     g_currentBoost.premultiply(m);
        // }

        // if(vrState !== null && vrState.hmd.lastRotation !== undefined){
        //     rotation = vrState.hmd.rotation;
        //     deltaRotation.multiplyQuaternions(vrState.hmd.lastRotation.inverse(), vrState.hmd.rotation);
        //     m = new THREE.Matrix4().makeRotationFromQuaternion(deltaRotation.inverse());
        //     g_currentBoost.premultiply(m);
        // }

        var rotation = new THREE.Matrix4().makeRotationY(Math.PI*param);
        g_currentBoost.premultiply(rotation);

        g_currentBoost.gramSchmidt(g_geometry);
    };

    this.zeroSensor = function(){
        if(!this._vrInput) return null;
        this._vrInput.zeroSensor();
    };

    this.getVRState = function(){
        var vrInput = this._vrInput;
        var oldVRState = this._oldVRState;
        var orientation = new THREE.Quaternion();
        var pos = new THREE.Vector3();
        var vrState;

        if(vrInput){
            if(vrInput.getState !== undefined){ 
                orientation.fromArray(vrInput.getState().orientation);
				pos.fromArray(vrInput.getState().position);
            }
            else{
                var framedata = new VRFrameData();
				vrInput.getFrameData(framedata);
				if(framedata.pose.orientation !== null  && framedata.pose.position !== null){
                    orientation.fromArray(framedata.pose.orientation);
                    pos.fromArray(framedata.pose.position);
				}
            }
        }

        else return null;
        if(orientation === null) return null;

        vrState = {
            hmd: {
                rotation: orientation,
                position: pos
            }
        };
        
        if(oldVRState !== undefined){
            vrState.hmd.lastPosition = oldVRState.hmd.position;
            vrState.hmd.lastRotation = oldVRState.hmd.rotation;
        }

        this._oldVRState = vrState;
        return vrState;
    };

};