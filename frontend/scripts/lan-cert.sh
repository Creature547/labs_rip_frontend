#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
ip="${1:-}"
if ! [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]] || ! awk -F. '{for(i=1;i<=4;i++) if ($i>255) exit 1}' <<<"$ip"; then
  echo 'Укажи IPv4 Wi-Fi ноутбука: bash scripts/lan-cert.sh 192.168.1.10'; exit 1
fi
umask 077
mkdir -p certs
if [[ ! -f certs/root.crt && ! -f certs/root.key ]]; then
  openssl req -x509 -newkey rsa:3072 -nodes -days 365 -sha256 -subj '/CN=Gremina Lab 7 Local CA' \
    -addext 'basicConstraints=critical,CA:TRUE,pathlen:0' -addext 'keyUsage=critical,keyCertSign,cRLSign' \
    -keyout certs/root.key -out certs/root.crt
fi
openssl req -new -newkey rsa:2048 -nodes -subj "/CN=$ip" -keyout certs/lan-key.pem -out certs/lan.csr
openssl x509 -req -in certs/lan.csr -CA certs/root.crt -CAkey certs/root.key -CAcreateserial -days 90 -sha256 \
  -extfile <(printf 'subjectAltName=IP:%s,IP:127.0.0.1,DNS:localhost\nbasicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n' "$ip") -out certs/lan.pem
openssl verify -CAfile certs/root.crt -verify_ip "$ip" certs/lan.pem
