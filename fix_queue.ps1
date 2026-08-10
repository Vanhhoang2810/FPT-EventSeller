(Get-Content "E:\FPT\backend\src\seeders\03-events.js") -replace 'queue_enabled: true', 'queue_enabled: false' | Set-Content "E:\FPT\backend\src\seeders\03-events.js"
