# HAProxy Management WebGUI

This is a simple web interface for managing haproxy cfg files. the config setup is documented here: https://www.daveknowstech.com/Dave-Knows-Tech-8a5a612e3f694755ae9022cce6975a69?p=2006861b18ee40d8a031d0760b0cb7f8&pm=c

![image](https://github.com/user-attachments/assets/470b0f0d-1455-46b3-bd30-a01387c908ae)


## Note

This isn't production ready code yet, its a proof of concept to create a simple webgui using the minimum amount of fuss to edit haproxy config files.


## PreInstall

Will need to install 

<li>node.js </li>
<li>npm  </li>
<li>git </li>

using your package manager

Everything is self enclosed and will run without a traditional webserver the service will launch on port tcp/3300

to change this edit config.js anc change the line

``PORT: 3300``


## Run

``git clone gitea@git.safehomelan.com:david/haproxygui.git``

``cd haproxygui``

``npm init -y``

``npm install dotenv``
``npm install openai``
``npm install util``
``npm install cors``
``npm install express``

``node server.js``


## Observations

### AI check
When you select a config file, an AI Check button will appear, this will use the OpenAI API to check the syntax of the config file and give you feedback on any errors or warnings.

As this goes out to the cloud it can take up to 10 seconds to return output

## References
https://www.daveknowstech.com/


