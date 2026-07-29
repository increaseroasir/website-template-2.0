"""Serve the template with a stubbed /api/inventory so the sold and pending card
states can be asserted without touching a client's live D1 data.

Usage: python3 scripts/lib/card-status-fixture.py <port> <template-root>
"""
import json
import os
import socketserver
import sys
import http.server
import urllib.parse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8921
ROOT = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.getcwd()


def product(slug, name, status, qty, promo, category='hot-tub'):
    return {
        "id": abs(hash(slug)) % 9999,
        "slug": slug,
        "inventory_name": name,
        "category": category,
        "status": status,
        "quantity": qty,
        "promo_label": promo,
        "price": 0,
        "monthly_payment": 189,
        "primary_image": "/assets/HOTTUBS_sun-pool-spa-six-person-hot-tub.webp",
        "quick_facts": ["6-7 person seating", "Open seating", "Up to 55 jets"],
        "gallery_images": [],
        "why_bullets": [],
        # Deliberately stale: a unit flipped to sold keeps its original Available
        # tag in D1, and the renderer must not trust it.
        "ghl_tags": ["Model Interest - " + name, "Inventory Status - Available"],
        "delivery_promise": "Delivery in 2 weeks",
        "positioning_label": "PREMIUM",
        "sort_order": 1,
        "featured": 0,
    }


PRODUCTS = [
    product('sold-unit', 'Hydropool Signature 728 Platinum', 'sold', 0, None),
    product('pending-unit', 'Hydropool Serenity 6600', 'pending', 1, '1 Left'),
    product('live-unit', 'DreamMaker Cabana 2500S Suite', 'available', 3, 'Event Price'),
]


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = urllib.parse.urlparse(path).path
        return os.path.join(ROOT, clean.lstrip('/')) or ROOT

    def do_GET(self):
        if self.path.startswith('/api/inventory'):
            body = json.dumps({"ok": True, "products": PRODUCTS}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def log_message(self, *args):
        pass


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    httpd.serve_forever()
