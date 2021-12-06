' Place this file in your system's startup folder.
' Make sure you replace the directories in this file with the correct ones for your use-case


' Wait a few seconds.. sometims commands don't run if we try to invoke them too early
WScript.Sleep 10*1000

set shell = WScript.CreateObject("WScript.shell")
' Initialize the sync app
shell.Run "cmd.exe /k pushd ""D:\ShopData\Jobs\Post Processors\.sync\"" & nodemon app.js", 1, false
WScript.Sleep 3*1000

' Run ngrok after a couple seconds to make sure local server is running and listening
' !!! Replace PORT with the port your app is running on !!!
shell.Run "cmd.exe /k pushd ""C:\tools\"" & ngrok.exe http 9876", 1, false
WScript.Sleep 3*1000

' Show tunnels so sysadmin knows to update github webhook
' 4040 is the default port for ngrok. Check your setup
shell.Run "cmd.exe /k curl localhost:4040/api/tunnels | python -mjson.tool | grep public_url", 1, false