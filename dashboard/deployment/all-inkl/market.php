<?php
// Public market data only. No uploaded files, credentials, visitor data or query URLs.
declare(strict_types=1);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    http_response_code(405);
    echo '{"error":"Method not allowed"}';
    exit;
}
function validDate($value): bool {
    if (!is_string($value)) return false;
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    return $date !== false && $date->format('Y-m-d') === $value;
}
function finiteNumber($value): bool {
    return (is_int($value) || is_float($value)) && is_finite((float)$value);
}
function readSource(string $url): array {
    if (!function_exists('curl_init')) throw new RuntimeException('cURL unavailable');
    $curl = curl_init($url);
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 5, CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_HTTPHEADER => ['Accept: application/json'], CURLOPT_USERAGENT => 'Stricker-CFO-Demo/1.0']);
    $body = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    if (!is_string($body) || $status !== 200) throw new RuntimeException('Source unavailable');
    $data = json_decode($body, true, 64, JSON_THROW_ON_ERROR);
    if (!is_array($data)) throw new RuntimeException('Invalid source');
    return $data;
}
function validPayload(array $data): bool {
    if (!validDate($data['asOf'] ?? null) || !is_string($data['fetchedAt'] ?? null)) return false;
    foreach (['EUR','USD','CHF','GBP','PLN'] as $currency) {
        $value = $data['rates'][$currency] ?? null;
        if (!finiteNumber($value) || $value <= 0) return false;
    }
    if ($data['rates']['EUR'] != 1) return false;
    $rate = $data['ecbRate'] ?? null;
    $date = $data['ecbAsOf'] ?? null;
    return ($rate === null && $date === null) ||
        (finiteNumber($rate) && $rate >= -100 && $rate <= 100 && validDate($date));
}
try {
    $cache = sys_get_temp_dir() . '/stricker-cfo-public-market-v2.json';
    $payload = null;
    if (is_file($cache) && filemtime($cache) > time() - 3600) {
        $cached = json_decode((string)file_get_contents($cache), true);
        if (is_array($cached) && validPayload($cached)) $payload = $cached;
    }
    if ($payload === null) {
        $fx = readSource('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,CHF,GBP,PLN&providers=ECB');
        if (($fx['base'] ?? null) !== 'EUR' || !validDate($fx['date'] ?? null)) throw new RuntimeException('Invalid FX data');
        $rates = ['EUR' => 1];
        foreach (['USD','CHF','GBP','PLN'] as $currency) {
            $value = $fx['rates'][$currency] ?? null;
            if (!finiteNumber($value) || $value <= 0) throw new RuntimeException('Invalid FX rate');
            $rates[$currency] = $value;
        }
        $ecbRate = null;
        $ecbAsOf = null;
        try {
            $ecb = readSource('https://data-api.ecb.europa.eu/service/data/FM/D.U2.EUR.4F.KR.DFR.LEV?lastNObservations=1&format=jsondata');
            $series = array_values($ecb['dataSets'][0]['series'] ?? []);
            if (count($series) !== 1) throw new RuntimeException('Invalid ECB series');
            $times = [];
            foreach ($ecb['structure']['dimensions']['observation'] ?? [] as $dimension) {
                if (($dimension['id'] ?? '') === 'TIME_PERIOD') $times = $dimension['values'] ?? [];
            }
            $observations = [];
            foreach ($series[0]['observations'] ?? [] as $index => $values) {
                $date = $times[(int)$index]['id'] ?? null;
                $value = $values[0] ?? null;
                if (!validDate($date) || !finiteNumber($value) || $value < -100 || $value > 100) throw new RuntimeException('Invalid ECB observation');
                $observations[$date] = $value;
            }
            if (!$observations) throw new RuntimeException('Missing ECB observation');
            krsort($observations);
            $ecbAsOf = array_key_first($observations);
            $ecbRate = $observations[$ecbAsOf];
        } catch (Throwable $ignored) {
            // FX remains available; the UI labels the interest rate as a demo assumption.
        }
        $payload = ['rates' => $rates, 'ecbRate' => $ecbRate, 'ecbAsOf' => $ecbAsOf,
            'asOf' => $fx['date'], 'source' => 'Frankfurter.dev · EZB-Referenzkurse', 'fetchedAt' => gmdate('Y-m-d\TH:i:s\Z')];
        if (!validPayload($payload)) throw new RuntimeException('Invalid market payload');
        $temporary = @tempnam(sys_get_temp_dir(), 'cfo-market-');
        if ($temporary !== false) {
            if (@file_put_contents($temporary, json_encode($payload, JSON_THROW_ON_ERROR)) !== false) @rename($temporary, $cache);
            if (is_file($temporary)) @unlink($temporary);
        }
    }
    header('Cache-Control: public, max-age=300');
    echo json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    http_response_code(503);
    header('Cache-Control: no-store');
    header('Retry-After: 60');
    echo '{"error":"Marktdaten momentan nicht verfügbar."}';
}
