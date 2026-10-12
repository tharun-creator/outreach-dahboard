$apiKey = $env:OPENROUTER_API_KEY
if (-not $apiKey) {
    Write-Error "Please set OPENROUTER_API_KEY environment variable"
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

$body = @{
    model = "moonshotai/kimi-k3"
    messages = @(
        @{
            role = "user"
            content = "What is the meaning of life?"
        }
    )
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "https://openrouter.ai/api/v1/chat/completions" -Method Post -Headers $headers -Body $body
    $response.choices[0].message.content
} catch {
    Write-Error $_.Exception.Response.StatusCode.value__
    $_.Exception.Response.GetResponseStream() | ForEach-Object { $_.ReadToEnd() }
}