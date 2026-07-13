#Requires AutoHotkey v2.0
#SingleInstance Force
Persistent

; Central Directories
RepoRoot := "C:\Users\Admin7\arh-family-lab"
AppDir := RepoRoot . "\apps\kids-terminal"
LockFile := AppDir . "\server.lock"

; Initialize Tray State
TraySetIcon("shell32.dll", 132) ; Default offline (Red X)
A_IconTip := "Agy Cadet Space Station`nStatus: Checking..."

; Create Custom Tray Menu
A_TrayMenu.Delete()
A_TrayMenu.Add("Agy Cadet Space Station", (*) => OpenBrowser())
A_TrayMenu.SetDefault("Agy Cadet Space Station")
A_TrayMenu.Add() ; Separator

Global StatusItemText := "Status: Checking..."
A_TrayMenu.Add(StatusItemText, (*) => CheckStatus())
A_TrayMenu.Disable(StatusItemText)
A_TrayMenu.Add() ; Separator

A_TrayMenu.Add("Open Cadet Console", (*) => OpenBrowser())
A_TrayMenu.Add("Open Parent Portal (/admin)", (*) => OpenAdmin())
A_TrayMenu.Add() ; Separator

A_TrayMenu.Add("Restart Express Server", (*) => RestartServer())
A_TrayMenu.Add("Sync Repository (git pull)", (*) => SyncRepository())
A_TrayMenu.Add("Static Rebuild Check", (*) => RebuildFrontend())
A_TrayMenu.Add() ; Separator

A_TrayMenu.Add("Exit Tray Agent", (*) => ExitApp())

; Health check timer (runs every 5 seconds)
SetTimer(CheckStatus, 5000)
CheckStatus()

; ============================================================================
; HELPER ACTIONS
; ============================================================================

OpenBrowser() {
    Run("http://localhost:3000/apps/kids-terminal/")
}

OpenAdmin() {
    Run("http://localhost:3000/apps/kids-terminal/admin")
}

CheckStatus() {
    Global StatusItemText
    whr := ComObject("WinHttp.WinHttpRequest.5.1")
    isOnline := false
    try {
        whr.Open("GET", "http://localhost:3000/api/config", true)
        whr.Send()
        whr.WaitForResponse(2)
        if (whr.Status == 200) {
            isOnline := true
        }
    } catch {
        isOnline := false
    }
    
    NewText := isOnline ? "Status: Online (Port 3000)" : "Status: Offline"
    if (StatusItemText != NewText) {
        try {
            A_TrayMenu.Rename(StatusItemText, NewText)
            StatusItemText := NewText
        }
    }
    
    if (isOnline) {
        TraySetIcon("shell32.dll", 44) ; Star icon (Online)
    } else {
        TraySetIcon("shell32.dll", 132) ; Red X icon (Offline)
    }
    A_IconTip := "Agy Cadet Space Station`n" . NewText
}

RestartServer() {
    ToolTip("Stopping Agy Cadet server...")
    SetTimer(() => ToolTip(), -2000)
    
    ; 1. Stop current node server PID if lock file exists
    if FileExist(LockFile) {
        try {
            Pid := FileRead(LockFile)
            if (Pid) {
                RunWait("taskkill /F /PID " Pid, , "Hide")
            }
            FileDelete(LockFile)
        } catch {
            ; PID check fail
        }
    }
    
    ; 2. Stop any rogue node server on port 3000 using netstat
    try {
        RunWait("powershell.exe -NoProfile -Command `"Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue`"", , "Hide")
    } catch {
        ; Ignore
    }
    
    Sleep(500)
    
    ; 3. Boot server using launcher batch file
    ToolTip("Starting Agy Cadet server...")
    SetTimer(() => ToolTip(), -2000)
    Run("cmd.exe /c run-kids-terminal.bat", RepoRoot, "Hide")
    
    ; Re-check status immediately
    Sleep(1500)
    CheckStatus()
}

SyncRepository() {
    ToolTip("Running git pull...")
    SetTimer(() => ToolTip(), -3000)
    RunWait("git pull", RepoRoot, "Hide")
    MsgBox("Git synchronization completed. Check console output if needed.", "Agy Cadet Sync", 64)
}

RebuildFrontend() {
    MsgBox("Frontend is pure static HTML/CSS/JS.`nChanges are instantly active. No compile step required!", "Agy Cadet Build Engine", 64)
}
