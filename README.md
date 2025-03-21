# Cohomology fractals
Drawing cohomology fractals with the GPU. Try it out for yourself at https://henryseg.github.io/cohomology_fractals/

Derived from the websperience hypVR-Ray by Roice Nelson, Henry Segerman and Michael Woodard featured over at https://github.com/mtwoodard/hypVR-Ray, which was in turn based on the websperience  by Vi Hart, Andrea Hawksley, Sabetta Matsumoto and Henry Segerman featured over at https://github.com/hawksley/hypVR. 

This project is being worked on by David Bachman, Saul Schleimer, and Henry Segerman.
Henry Segerman is partially supported by NSF grant DMS-1708239. Any opinions, findings, and conclusions or recommendations expressed in this material are those of the author(s) and do not necessarily reflect the views of the National Science Foundation.

# Controls
Use arrow keys to move and "wasd" to rotate the camera. "q" and "e" roll the camera. Click the "Open Controls" tab for more options.

# Links
* http://segerman.org/
* http://michaelwoodard.net
* http://vihart.com
* http://andreahawksley.com
* http://www.geometrygames.org/CurvedSpaces/
* https://github.com/MozVR/vr-web-examples/tree/master/threejs-vr-boilerplate

# Running Locally
Running this locally requires a simple web server (to source the shader files at runtime), with the root at the same level as index.html. This can be done in python 3 by running the command "python -m http.server". In python 2, run the command "python -m SimpleHTTPServer 8000", then go to "http://localhost:8000/" in your browser. On Windows, you can set up a server in the Control Panel Administrative Tools, in the IIS Manager (you may need to turn this feature on first). NOTE: The server will need to have a MIME type configuration for .glsl files set to "text/plain".
