@echo off
set pwd=%cd%
del /f /s /q %pwd%\peer\resource\*.*
del /f /s /q %pwd%\peer2\resource\*.*
del /f /s /q %pwd%\peer3\resource\*.*
del /f /s /q %pwd%\peer\default.log
del /f /s /q %pwd%\peer2\default.log
del /f /s /q %pwd%\peer3\default.log
del /f /s /q %pwd%\tracker\default.log