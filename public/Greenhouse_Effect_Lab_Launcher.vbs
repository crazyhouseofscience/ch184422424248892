Set WshShell = CreateObject("WScript.Shell")
On Error Resume Next
WshShell.Run "msedge.exe --app=https://ais-pre-6ic3kypyuhb3jcgcbcab25-95964816912.us-east5.run.app", 1, False
If Err.Number <> 0 Then
    Err.Clear
    WshShell.Run "https://ais-pre-6ic3kypyuhb3jcgcbcab25-95964816912.us-east5.run.app", 1, False
End If
