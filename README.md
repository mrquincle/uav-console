<!-- Uses markdown syntax for neat display at github -->

# UAV-Console
The UAV console allows you - in the end - to control a swarm of UAVs simultaneously in the air. Currently, the focus is on a first sketchup of the visual interface. Subsequently a REST interface is provided to another process on the server that actually is connected to a boosted radio and sends the messages (in the proper format) into the air.

To fake the ground station that usually gets over RF messages from the UAVs, you can build the [gsGuiInterface](https://github.com/mrquincle/FireSoft/tree/master/gsGuiInterface) module in the FireSoft architecture. Define for that "DUMMY" and "NODEJSSERVER" (which will be moved to the configuration file as options soon). If there is no ground stations you will not see the messages from the UAVs. The state table is build up automatically, if the ground stations sends different tuples, they will be displayed automatically as long as there is an "uav_id" field.

## Screenshots

The following shows a screenshot of the visualization of the UAVs:

![Screenshot](https://github.com/mrquincle/uav-console/raw/master/doc/uav_swarm.png "Screenshot")

The following shows a screenshot where we added commands to control the planes:

![Screenshot](https://github.com/mrquincle/uav-console/raw/master/doc/uav_console.png "Console with commands")

## How to install and run?

The following installation instructions are okay for Ubuntu or Debian-based systems. Adapt to your own needs.

* sudo aptitude install nodejs npm
* git clone https://github.com/mrquincle/uav-console.git
* cd uav-console
* npm install -d # uses information from package.json to install the required packages in node_modules
* firefox http://localhost:8080

It seems to be [practice](http://www.futurealoof.com/posts/nodemodules-in-git.html) to commit also node modules in the nodejs community, hence I did. It should accelerate your install and "npm install -d" should get you even more uptodate if you want to.

## Copyrights
The copyrights (2012) belong to:

- Author: Anne van Rossum
- Almende B.V., http://www.almende.com and DO bots B.V., http://www.dobots.nl
- Rotterdam, The Netherlands


