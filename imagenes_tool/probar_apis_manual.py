# -*- coding: utf-8 -*-
"""
Script de prueba manual para investigar las APIs de los dominios
"""
import requests
import json

TIMEOUT = 12
sesion = requests.Session()
sesion.headers["User-Agent"] = "Mozilla/5.0 (compatible; OrencioMatasImgBot/1.0)"

def probar_babaria():
    print("=== Probando BABARIA ===")
    dominio = "babaria.es"
    
    # Prueba 1: Store API
    print("\n1. Store API con query 'aloe vera':")
    url = f"https://{dominio}/wp-json/wc/store/v1/products"
    r = sesion.get(url, params={"search": "aloe vera", "per_page": 5}, timeout=TIMEOUT)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Items: {len(data)}")
        if data:
            for i, item in enumerate(data[:2]):
                print(f"   Item {i}: {item.get('name', 'N/A')}")
                images = item.get("images") or []
                if images:
                    print(f"     Imagen: {images[0].get('src', 'N/A')}")
    
    # Prueba 2: Store API con query más simple
    print("\n2. Store API con query 'aloe':")
    r = sesion.get(url, params={"search": "aloe", "per_page": 5}, timeout=TIMEOUT)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Items: {len(data)}")
        if data:
            for i, item in enumerate(data[:2]):
                print(f"   Item {i}: {item.get('name', 'N/A')}")
    
    # Prueba 3: Sin parámetro search (listar productos)
    print("\n3. Store API sin search (listar productos):")
    r = sesion.get(url, params={"per_page": 5}, timeout=TIMEOUT)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Items: {len(data)}")
        if data:
            for i, item in enumerate(data[:2]):
                print(f"   Item {i}: {item.get('name', 'N/A')}")

def probar_sora():
    print("\n=== Probando SORA ===")
    dominio = "cosmeticossora.com"
    
    url = f"https://{dominio}/wp-json/wc/store/v1/products"
    print("\n1. Store API con query 'crema':")
    r = sesion.get(url, params={"search": "crema", "per_page": 5}, timeout=TIMEOUT)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Items: {len(data)}")
        if data:
            for i, item in enumerate(data[:2]):
                print(f"   Item {i}: {item.get('name', 'N/A')}")

def probar_vijusa():
    print("\n=== Probando VIJUSA ===")
    dominio = "vijusa.com"
    
    # Prueba 1: Store API
    url = f"https://{dominio}/wp-json/wc/store/v1/products"
    print("\n1. Store API con query 'gel':")
    r = sesion.get(url, params={"search": "gel", "per_page": 5}, timeout=TIMEOUT)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Items: {len(data)}")
        if data:
            for i, item in enumerate(data[:2]):
                print(f"   Item {i}: {item.get('name', 'N/A')}")
    
    # Prueba 2: WP Search
    print("\n2. WP Search con query 'gel':")
    url = f"https://{dominio}/wp-json/wp/v2/search"
    r = sesion.get(url, params={"search": "gel", "subtype": "product", "per_page": 5}, timeout=TIMEOUT)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Items: {len(data)}")
        if data:
            for i, item in enumerate(data[:2]):
                print(f"   Item {i}: {item.get('title', 'N/A')} (id: {item.get('id')})")

if __name__ == "__main__":
    probar_babaria()
    probar_sora()
    probar_vijusa()
