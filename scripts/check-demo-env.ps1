# scripts/check-demo-env.ps1
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  AI NOVEL CO-LAB DEMO ENVIRONMENT CHECK " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

function Check-Port ($port, $name) {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $connected = $false
    try {
        $connection = $tcp.BeginConnect("localhost", $port, $null, $null)
        $success = $connection.AsyncWaitHandle.WaitOne(1000, $false)
        if ($success) {
            $tcp.EndConnect($connection)
            $connected = $true
        }
    } catch {
        # ignore
    } finally {
        $tcp.Close()
    }
    return $connected
}

# 1. Docker CLI
Write-Host "[1/6] Kiem tra Docker CLI..." -NoNewline
$dockerCli = Get-Command docker -ErrorAction SilentlyContinue
$hasDocker = $false
if ($dockerCli) {
    Write-Host " [PASS]" -ForegroundColor Green
    $hasDocker = $true
} else {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Host "    -> Chua tim thay Docker CLI trong PATH. Hay cai dat Docker Desktop." -ForegroundColor Yellow
}

# 2. Docker Daemon
Write-Host "[2/6] Kiem tra Docker Daemon..." -NoNewline
if ($hasDocker) {
    $dockerInfo = docker info 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [PASS]" -ForegroundColor Green
        $daemonRunning = $true
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        Write-Host "    -> Docker Desktop da cai dat nhung chua khoi dong. Hay mo Docker Desktop GUI." -ForegroundColor Yellow
        $daemonRunning = $false
    }
} else {
    Write-Host " [SKIP] (Chua co Docker CLI)" -ForegroundColor Gray
    $daemonRunning = $false
}

# 3. Docker Containers (local-mongodb & local-redis)
Write-Host "[3/6] Kiem tra Database Containers..." -NoNewline
if ($daemonRunning) {
    $containers = docker ps -a --format "{{.Names}}: {{.State}}" 2>$null
    $mongoExist = $false
    $mongoRunning = $false
    $redisExist = $false
    $redisRunning = $false

    foreach ($c in $containers) {
        if ($c -match "local-mongodb") {
            $mongoExist = $true
            if ($c -match "running") {
                $mongoRunning = $true
            }
        }
        if ($c -match "local-redis") {
            $redisExist = $true
            if ($c -match "running") {
                $redisRunning = $true
            }
        }
    }

    if ($mongoRunning -and $redisRunning) {
        Write-Host " [PASS]" -ForegroundColor Green
        Write-Host "    - local-mongodb: Dang chay" -ForegroundColor Gray
        Write-Host "    - local-redis: Dang chay" -ForegroundColor Gray
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        if (-not $mongoExist) {
            Write-Host "    - local-mongodb: Chua duoc tao." -ForegroundColor Yellow
        } elseif (-not $mongoRunning) {
            Write-Host "    - local-mongodb: Da tao nhung dang dung." -ForegroundColor Yellow
        }
        if (-not $redisExist) {
            Write-Host "    - local-redis: Chua duoc tao." -ForegroundColor Yellow
        } elseif (-not $redisRunning) {
            Write-Host "    - local-redis: Da tao nhung dang dung." -ForegroundColor Yellow
        }

        Write-Host "    -> Huong khac phuc: Chay 'pnpm db:up' o thu muc goc de khoi dong." -ForegroundColor Yellow
    }
} else {
    Write-Host " [SKIP] (Chua khoi chay Docker Daemon)" -ForegroundColor Gray
}

# 4. Database Port Connections (27017, 6379)
Write-Host "[4/6] Kiem tra cong ket noi Database..." -NoNewline
$mongoPort = Check-Port 27017 "MongoDB"
$redisPort = Check-Port 6379 "Redis"

if ($mongoPort -and $redisPort) {
    Write-Host " [PASS]" -ForegroundColor Green
    Write-Host "    - Port 27017 (MongoDB): KET NOI OK" -ForegroundColor Gray
    Write-Host "    - Port 6379 (Redis): KET NOI OK" -ForegroundColor Gray
} else {
    Write-Host " [FAIL]" -ForegroundColor Red
    if (-not $mongoPort) {
        Write-Host "    - Port 27017 (MongoDB): KET NOI THAT BAI" -ForegroundColor Yellow
    }
    if (-not $redisPort) {
        Write-Host "    - Port 6379 (Redis): KET NOI THAT BAI" -ForegroundColor Yellow
    }
    Write-Host "    -> Huong khac phuc: Dam bao container da khoi dong va dung port." -ForegroundColor Yellow
}

# 5. Backend Server (Port 3001)
Write-Host "[5/6] Kiem tra Backend NestJS (Port 3001)..." -NoNewline
$backendOk = Check-Port 3001 "Backend"
if ($backendOk) {
    Write-Host " [PASS]" -ForegroundColor Green
} else {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Host "    -> Backend NestJS chua duoc khoi dong." -ForegroundColor Yellow
    Write-Host "    -> Huong khac phuc: Chay 'pnpm dev' (hoac 'pnpm dev:backend') o thu muc goc." -ForegroundColor Yellow
}

# 6. Frontend Server (Port 3000)
Write-Host "[6/6] Kiem tra Frontend Next.js (Port 3000)..." -NoNewline
$frontendOk = Check-Port 3000 "Frontend"
if ($frontendOk) {
    Write-Host " [PASS]" -ForegroundColor Green
} else {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Host "    -> Frontend Next.js chua duoc khoi dong." -ForegroundColor Yellow
    Write-Host "    -> Huong khac phuc: Chay 'pnpm dev' (hoac 'pnpm dev:frontend') o thu muc goc." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "             TONG KET KIEM TRA           " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$allReady = $true
if (-not $hasDocker) { $allReady = $false }
if (-not $daemonRunning) { $allReady = $false }
if (-not $mongoPort) { $allReady = $false }
if (-not $redisPort) { $allReady = $false }
if (-not $backendOk) { $allReady = $false }
if (-not $frontendOk) { $allReady = $false }

if ($allReady) {
    Write-Host ">>> MOI TRUONG DEMO DA SAN SANG 100%! <<<" -ForegroundColor Green
    Write-Host "Buoc tiep theo: Chay lenh sau de khoi tao du lieu mau (Seed):" -ForegroundColor Green
    Write-Host "Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/rooms/seed" -ForegroundColor Yellow
} else {
    Write-Host ">>> CO MOT SO HANG MUC CHUA SAN SANG! <<<" -ForegroundColor Red
    Write-Host "Hay thuc hien theo cac huong dan khac phuc mau vang o tren." -ForegroundColor Yellow
}
Write-Host ""
