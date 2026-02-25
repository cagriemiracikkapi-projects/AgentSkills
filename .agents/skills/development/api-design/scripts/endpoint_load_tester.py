#!/usr/bin/env python3
"""Concurrent HTTP load tester using asyncio + urllib.request (stdlib only)."""
import argparse
import asyncio
import statistics
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor


def _http_get(url: str) -> tuple[float, int]:
    """Perform a single HTTP GET and return (latency_ms, status_code)."""
    start = time.perf_counter()
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            _ = resp.read()
            status = resp.status
    except urllib.error.HTTPError as exc:
        status = exc.code
    except Exception:
        status = 0
    elapsed = (time.perf_counter() - start) * 1000.0
    return elapsed, status


def _percentile(data: list[float], pct: float) -> float:
    if not data:
        return 0.0
    sorted_data = sorted(data)
    idx = (len(sorted_data) - 1) * pct / 100.0
    lo = int(idx)
    hi = lo + 1
    frac = idx - lo
    if hi >= len(sorted_data):
        return sorted_data[lo]
    return sorted_data[lo] + frac * (sorted_data[hi] - sorted_data[lo])


async def _worker(url: str, duration: float, executor, results: list):
    loop = asyncio.get_event_loop()
    deadline = time.perf_counter() + duration
    while time.perf_counter() < deadline:
        latency, status = await loop.run_in_executor(executor, _http_get, url)
        results.append((latency, status))


async def run_load_test(url: str, users: int, duration: float):
    print(f"🔥 Endpoint Load Tester")
    print(f"Target URL:    {url}")
    print(f"Virtual Users: {users}")
    print(f"Duration:      {duration}s")
    print("Running...", flush=True)

    results: list[tuple[float, int]] = []
    wall_start = time.perf_counter()

    with ThreadPoolExecutor(max_workers=users) as executor:
        tasks = [
            asyncio.create_task(_worker(url, duration, executor, results))
            for _ in range(users)
        ]
        await asyncio.gather(*tasks)

    wall_elapsed = time.perf_counter() - wall_start

    if not results:
        print("❌ No requests completed.")
        return

    latencies = [r[0] for r in results]
    statuses = [r[1] for r in results]
    total = len(results)
    errors_5xx = sum(1 for s in statuses if 500 <= s < 600)
    errors_4xx = sum(1 for s in statuses if 400 <= s < 500)
    errors_429 = sum(1 for s in statuses if s == 429)
    errors_net = sum(1 for s in statuses if s == 0)
    throughput = total / max(wall_elapsed, 0.001)

    print(f"\n📊 Results")
    print(f"Total Requests:   {total:,}")
    print(f"Duration (wall):  {wall_elapsed:.2f}s")
    print(f"Throughput:       {throughput:.1f} req/s")
    print(f"")
    print(f"Latency (ms):")
    print(f"  min:  {min(latencies):.1f}")
    print(f"  mean: {statistics.mean(latencies):.1f}")
    print(f"  p50:  {_percentile(latencies, 50):.1f}")
    print(f"  p95:  {_percentile(latencies, 95):.1f}")
    print(f"  p99:  {_percentile(latencies, 99):.1f}")
    print(f"  max:  {max(latencies):.1f}")
    print(f"")
    print(f"Errors:")
    print(f"  5xx:     {errors_5xx} ({errors_5xx/total*100:.2f}%)")
    print(f"  429:     {errors_429} ({errors_429/total*100:.2f}%)")
    print(f"  4xx:     {errors_4xx} ({errors_4xx/total*100:.2f}%)")
    print(f"  network: {errors_net} ({errors_net/total*100:.2f}%)")

    ok = total - errors_5xx - errors_net
    if ok / total >= 0.99 and _percentile(latencies, 95) < 500:
        print("\n✅ Endpoint is healthy.")
    else:
        print("\n⚠️  Endpoint may have issues. Review error rates and p95 latency.")


def main():
    parser = argparse.ArgumentParser(description="Concurrent HTTP load tester (stdlib only).")
    parser.add_argument("url", help="Target URL to load test")
    parser.add_argument("--users", type=int, default=10, help="Number of concurrent virtual users (default: 10)")
    parser.add_argument("--duration", type=float, default=10.0, help="Test duration in seconds (default: 10)")
    args = parser.parse_args()

    asyncio.run(run_load_test(args.url, args.users, args.duration))


if __name__ == "__main__":
    main()
