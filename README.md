# Cannon-Thurston
Drawing Cannon-Thurston maps with the GPU.

Derived from the websperience hypVR-Ray by Roice Nelson, Henry Segerman and Michael Woodard featured over at https://github.com/mtwoodard/hypVR-Ray, which was in turn based on the websperience  by Vi Hart, Andrea Hawksley, Sabetta Matsumoto and Henry Segerman featured over at https://github.com/hawksley/hypVR. 

This project is being worked on by David Bachman, Saul Schleimer, and Henry Segerman.
Henry Segerman is partially supported by NSF grant DMS-1708239.

# Links
* http://segerman.org/
* http://michaelwoodard.net
* http://vihart.com
* http://andreahawksley.com
* http://www.geometrygames.org/CurvedSpaces/
* https://github.com/MozVR/vr-web-examples/tree/master/threejs-vr-boilerplate

# Running Locally
Running this locally requires a simple web server (to source the shader files at runtime), with the root at the same level as index.html. This can be done in python 3 by running the command "python -m http.server". On Windows, you can set up a server in the Control Panel Administrative Tools, in the IIS Manager (you may need to turn this feature on first). NOTE: The server will need to have a MIME type configuration for .glsl files set to "text/plain".

# Controls
Use arrow keys to move and "wasd" to rotate the camera. "q" and "e" roll the camera. 