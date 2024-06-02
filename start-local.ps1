$env:NODE_ENV = "production"
$env:PORT = "46220"
$env:KEYPRACTICA_REALM = "keypractica_auth"
$env:KEYPRACTICA_AUTH_SERVER_URL = "https://auth.keypractica.com"
$env:KEYPRACTICA_RESOURCE = "keypractica_projects"

$nodePath = "node.exe"

& $nodePath server.cjs
