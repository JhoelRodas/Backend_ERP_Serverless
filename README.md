Problema 1 — AzureWebJobsStorage (causa raíz)
En Azure Functions v4, el runtime siempre necesita un emulador de Storage para su funcionamiento interno (bloqueo de host, historial), incluso si tus funciones son solo HTTP. Poner "" no funciona — provoca el error Unable to create client.

# Terminal 1 — instalar Azurite (solo una vez)
npm install -g azurite


# Terminal 1 — ejecutar el emulador (déjalo corriendo)
azurite --silent --location C:\azurite --debug C:\azurite\debug.log

Luego en local.settings.json restaura el valor original:

"AzureWebJobsStorage": "UseDevelopmentStorage=true",