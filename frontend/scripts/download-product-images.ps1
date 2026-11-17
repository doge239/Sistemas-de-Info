$ErrorActionPreference = 'Stop'
$imageDirectory = Join-Path $PSScriptRoot '../public/images/products'
New-Item -ItemType Directory -Force -Path $imageDirectory | Out-Null
$products = @(
    @('PFA001', 'ideapad', 'notebook lenovo'),
    @('PFA017', '54313', 'ASUS RTX 4060'),
    @('PFA032', '53788', 'SSD Crucial NVMe'),
    @('PFA045', '53867', 'monitor samsung'),
    @('PFA078', '52424', 'Teclado Logitech Pro X'),
    @('PFA079', '31218', 'g502'),
    @('PFA120', 'desktop ryzen 5', 'desktop gamer'),
    @('PFA133', 'cloud ii', 'hyperx cloud'),
    @('PFA140', 'vivobook 15', 'vivobook'),
    @('PFA141', 'aspire 5', 'notebook acer'),
    @('PFA142', 'notebook hp 15', 'notebook hp'),
    @('PFA143', '50594', 'kingston fury 16'),
    @('PFA144', '48644', 'Router TP-Link doble banda'),
    @('PFA145', '57525', 'Multifuncional HP'),
    @('PFA146', 'antivirus', 'antivirus'),
    @('PFA147', 'gabinete atx', 'gabinete'),
    @('PFA148', 'kingston nv2', 'ssd kingston'),
    @('PFA149', 'mousepad xl', 'mousepad'),
    @('PFA150', 'c920', 'webcam logitech'),
    @('PFA151', 'monitor samsung 27', 'monitor samsung')
)
$sources = @()
foreach ($product in $products) {
    $items = @()
    if ($product[1] -match '^\d+$') {
        $items = @([PSCustomObject]@{id=$product[1];nombre=$product[2]})
    } else { foreach ($query in $product[1..2]) {
        $search = [Uri]::EscapeDataString($query)
        $result = Invoke-RestMethod "https://api.pcfactory.cl/pcfactory-services-catalogo/v1/catalogo/productos?page=0&size=1&search=$search"
        $items = @($result.content.items)
        if ($items.Count -gt 0 -and $items[0]) { break }
    } }
    if (!$items[0]) { throw "No image found for $($product[0])" }
    $item = $items[0]
    $url = "https://assets.pcfactory.cl/public/foto/$($item.id)/1_1000.jpg"
    $original = Join-Path $imageDirectory "$($product[0]).jpg"
    Invoke-WebRequest $url -OutFile $original -UseBasicParsing
    $sources += [PSCustomObject]@{sku=$product[0];source=$url;product="https://www.pcfactory.cl/producto/$($item.id)";referenceName=$item.nombre}
    Write-Output "Downloaded $($product[0])"
}
$sources | ConvertTo-Json -Depth 3 | Set-Content -Encoding UTF8 (Join-Path $imageDirectory 'sources.json')
