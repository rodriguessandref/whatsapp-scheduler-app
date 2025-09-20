[build]
builder = "NIXPACKS"
environment = {}

[variables]

# Diretório onde está o projeto Node.js
[phases.setup]
working_directory = "whatsapp_scheduler_app"

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = []

[start]
cmd = "npm start"

