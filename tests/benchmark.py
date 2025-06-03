import requests
import time
import sys

def run_benchmark(url, requests_count=1000):
    times = []
    for _ in range(requests_count):
        start = time.perf_counter()
        response = requests.post(url, json={"text": "Consulta sobre servicios técnicos"})
        elapsed = time.perf_counter() - start
        times.append(elapsed)
        if response.status_code != 200:
            print(f"Error en request: {response.status_code}")
    return times

if __name__ == "__main__":
    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        url = "http://localhost:5000/classify"
    print(f"Iniciando benchmark en {url}...")
    times = run_benchmark(url, 1000)
    avg_time = sum(times) / len(times) * 1000
    min_time = min(times) * 1000
    max_time = max(times) * 1000
    print("\nResultados:")
    print(f"  Total requests: {len(times)}")
    print(f"  Tiempo promedio: {avg_time:.2f}ms")
    print(f"  Tiempo mínimo: {min_time:.2f}ms")
    print(f"  Tiempo máximo: {max_time:.2f}ms")
    print(f"  Requests/segundo: {1000/avg_time:.2f}")
