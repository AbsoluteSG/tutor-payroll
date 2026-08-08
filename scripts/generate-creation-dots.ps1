# Generates public/v3/creation-dots.svg — a halftone dot-matrix rendering of the
# two reaching arms from Michelangelo's Creation of Adam, used as the hero art on
# /v3/courses/math.
#
# The source fresco is public domain (Michelangelo, c. 1512). Download it from
# Wikimedia Commons before running, and point $Source at it:
#   https://commons.wikimedia.org/wiki/File:Michelangelo_-_Creation_of_Adam_(cropped).jpg
#
# Usage:
#   ./scripts/generate-creation-dots.ps1 -Source <path-to-source.jpg> `
#       -Cols 300 -SvgOut ./public/v3/creation-dots.svg
#
# Two signals, two jobs:
#   MASK  — where is flesh?  Warmth (R-B), because the plaster background is as
#           bright as lit skin, so luminance cannot separate them. Gated by a
#           luminance floor to reject God's dark red mantle and deep shadow.
#   TONE  — how big is each dot?  Inverted luminance *within* the mask, so
#           shadowed modelling reads dense and lit surfaces read open, which is
#           how a printed halftone reproduces form. A floor keeps highlights as
#           small dots rather than holes, so the limbs stay continuous.
param(
  [double]$X0 = 0.18,  [double]$X1 = 0.545,
  [double]$Y0 = 0.33,  [double]$Y1 = 0.515,
  [int]$Cols = 260,
  [double]$MaskWarm = 0.27,    # blurred warmth needed to count as flesh
  [double]$MaskLuma = 0.42,    # luminance floor for flesh
  [int]$WarmBlur = 2,          # box-blur passes over warmth before thresholding
  [double]$ToneDark = 0.44,    # luminance mapped to a full dot
  [double]$ToneLight = 0.93,   # luminance mapped to the smallest dot
  [double]$ToneFloor = 0.22,   # smallest dot inside the mask
  [double]$DotMax = 0.44,      # radius in grid units at full tone (<0.5 = dots never touch)
  [double]$Gamma = 0.9,
  [string]$Fill = "#14110E",
  [string]$Source = "",
  [string]$SvgOut = "",
  [string]$JsonOut = "",
  [string]$PngOut = ""
)

if ($Source -eq "" -or -not (Test-Path $Source)) {
  throw "Pass -Source <path to the public-domain source JPEG>. See the header comment for where to get it."
}

Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile((Resolve-Path $Source))

$cx = [int]($src.Width * $X0); $cw = [int]($src.Width * ($X1 - $X0))
$cy = [int]($src.Height * $Y0); $ch = [int]($src.Height * ($Y1 - $Y0))
$rows = [int][Math]::Round($Cols * $ch / $cw)
Write-Output "crop x=$cx y=$cy w=$cw h=$ch -> grid ${Cols}x${rows}"

$grid = New-Object System.Drawing.Bitmap $Cols, $rows
$g = [System.Drawing.Graphics]::FromImage($grid)
$g.InterpolationMode = 'HighQualityBicubic'
$g.DrawImage($src, (New-Object System.Drawing.Rectangle 0,0,$Cols,$rows), $cx, $cy, $cw, $ch, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$luma = New-Object 'double[,]' $Cols, $rows
$warm = New-Object 'double[,]' $Cols, $rows
for ($yy = 0; $yy -lt $rows; $yy++) {
  for ($xx = 0; $xx -lt $Cols; $xx++) {
    $p = $grid.GetPixel($xx, $yy)
    $luma[$xx,$yy] = (0.299*$p.R + 0.587*$p.G + 0.114*$p.B) / 255.0
    $warm[$xx,$yy] = [Math]::Max(0.0, ($p.R - $p.B) / 140.0)
  }
}
$grid.Dispose(); $src.Dispose()

# Blur warmth before thresholding: specular highlights along an arm desaturate
# and would otherwise cut the limb into disconnected islands. Averaging with the
# warm neighbours carries the flesh signal across those streaks.
function BoxBlur([double[,]]$m) {
  $out = New-Object 'double[,]' $Cols, $rows
  for ($yy=0; $yy -lt $rows; $yy++) {
    for ($xx=0; $xx -lt $Cols; $xx++) {
      $sum = 0.0; $n = 0
      for ($dy=-1; $dy -le 1; $dy++) {
        for ($dx=-1; $dx -le 1; $dx++) {
          $sx = $xx+$dx; $sy = $yy+$dy
          if ($sx -lt 0 -or $sy -lt 0 -or $sx -ge $Cols -or $sy -ge $rows) { continue }
          $sum += $m[$sx,$sy]; $n++
        }
      }
      $out[$xx,$yy] = $sum / $n
    }
  }
  # Unary comma: PowerShell would otherwise flatten the rank-2 array on return.
  return ,$out
}
for ($i = 0; $i -lt $WarmBlur; $i++) { $warm = BoxBlur $warm }

$mask = New-Object 'bool[,]' $Cols, $rows
for ($yy=0; $yy -lt $rows; $yy++) {
  for ($xx=0; $xx -lt $Cols; $xx++) {
    $mask[$xx,$yy] = ($warm[$xx,$yy] -gt $MaskWarm) -and ($luma[$xx,$yy] -gt $MaskLuma)
  }
}

# Morphological close: dilate (any set neighbour) then erode (all neighbours
# set) fills pinholes without inflating the silhouette.
function Morph([bool[,]]$m, [bool]$dilate) {
  $out = New-Object 'bool[,]' $Cols, $rows
  for ($yy=0; $yy -lt $rows; $yy++) {
    for ($xx=0; $xx -lt $Cols; $xx++) {
      $set = 0; $n = 0
      for ($dy=-1; $dy -le 1; $dy++) {
        for ($dx=-1; $dx -le 1; $dx++) {
          $sx = $xx+$dx; $sy = $yy+$dy
          if ($sx -lt 0 -or $sy -lt 0 -or $sx -ge $Cols -or $sy -ge $rows) { continue }
          $n++; if ($m[$sx,$sy]) { $set++ }
        }
      }
      $out[$xx,$yy] = if ($dilate) { $set -ge 1 } else { $set -eq $n }
    }
  }
  # Unary comma: PowerShell would otherwise flatten the rank-2 array on return.
  return ,$out
}
$mask = Morph $mask $true
$mask = Morph $mask $false

$kept = 0
for ($yy=0; $yy -lt $rows; $yy++) { for ($xx=0; $xx -lt $Cols; $xx++) { if ($mask[$xx,$yy]) { $kept++ } } }
Write-Output "mask cells: $kept / $($Cols*$rows)"

# --- render ---
# Larger cell for the proof image so a coarse grid is still legible on screen.
$cell = 14.0
$bmp = New-Object System.Drawing.Bitmap ([int]($Cols*$cell)), ([int]($rows*$cell))
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(255,237,233,225))
$g.SmoothingMode = 'AntiAlias'
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,20,17,14))

$sb = New-Object System.Text.StringBuilder
[void]$sb.Append("<svg xmlns=`"http://www.w3.org/2000/svg`" viewBox=`"0 0 $Cols $rows`" fill=`"$Fill`">")
# The JSON form is the one the site actually renders: the page builds a real
# <circle> per entry so individual dots can be animated (scroll dissipation).
$json = New-Object System.Text.StringBuilder
[void]$json.Append("{`"cols`":$Cols,`"rows`":$rows,`"dots`":[")
$first = $true
$count = 0

for ($yy=0; $yy -lt $rows; $yy++) {
  for ($xx=0; $xx -lt $Cols; $xx++) {
    if (-not $mask[$xx,$yy]) { continue }
    $t = ($ToneLight - $luma[$xx,$yy]) / ($ToneLight - $ToneDark)
    if ($t -lt 0) { $t = 0 }; if ($t -gt 1) { $t = 1 }
    $size = $ToneFloor + (1.0 - $ToneFloor) * [Math]::Pow($t, $Gamma)

    $r = $size * ($cell * $DotMax)
    $g.FillEllipse($brush, [single]($xx*$cell + $cell/2 - $r), [single]($yy*$cell + $cell/2 - $r), [single]($r*2), [single]($r*2))

    $rs = [Math]::Round($size * $DotMax, 3)
    [void]$sb.Append("<circle cx=`"$([Math]::Round($xx + 0.5, 1))`" cy=`"$([Math]::Round($yy + 0.5, 1))`" r=`"$rs`"/>")

    if (-not $first) { [void]$json.Append(",") }
    [void]$json.Append("[$xx,$yy,$rs]")
    $first = $false
    $count++
  }
}
[void]$sb.Append("</svg>")

$g.Dispose()
if ($PngOut -ne "") {
  $bmp.Save($PngOut, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output "wrote $PngOut ($count dots)"
}
$bmp.Dispose()
Write-Output "dots: $count"

if ($SvgOut -ne "") {
  [System.IO.File]::WriteAllText($SvgOut, $sb.ToString())
  Write-Output ("wrote $SvgOut  " + [math]::Round((Get-Item $SvgOut).Length/1KB,1) + " KB")
}

if ($JsonOut -ne "") {
  [void]$json.Append("]}")
  [System.IO.File]::WriteAllText($JsonOut, $json.ToString())
  Write-Output ("wrote $JsonOut  " + [math]::Round((Get-Item $JsonOut).Length/1KB,1) + " KB")
}
