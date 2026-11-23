#!/usr/bin/env bash
set -euo pipefail
# Pin the Tailwind generator to create the local styles that the distributed
# game previously loaded from the remote Tailwind CDN.
npx --yes tailwindcss@3.4.17 -i android/tailwind-input.css -o android/app/src/main/assets/ascension-tailwind.css --content assets/index-BjuLtVzX.js --minify
test -s android/app/src/main/assets/ascension-tailwind.css
# Bundle licensed Montserrat font weights so the typography remains consistent
# without external Google Fonts requests.
npm pack @fontsource/montserrat@5.2.8 --silent > /tmp/ascension-font-pack-name
mkdir -p /tmp/ascension-montserrat android/app/src/main/assets/fonts
tar -xzf "$(cat /tmp/ascension-font-pack-name)" -C /tmp/ascension-montserrat
for weight in 100 300 400 600; do
  cp "/tmp/ascension-montserrat/package/files/montserrat-latin-${weight}-normal.woff2" android/app/src/main/assets/fonts/
done
cat > android/app/src/main/assets/local-fonts.css <<'CSS'
@font-face {font-family:Montserrat;src:url('./fonts/montserrat-latin-100-normal.woff2') format('woff2');font-weight:100;font-style:normal;font-display:swap}
@font-face {font-family:Montserrat;src:url('./fonts/montserrat-latin-300-normal.woff2') format('woff2');font-weight:300;font-style:normal;font-display:swap}
@font-face {font-family:Montserrat;src:url('./fonts/montserrat-latin-400-normal.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap}
@font-face {font-family:Montserrat;src:url('./fonts/montserrat-latin-600-normal.woff2') format('woff2');font-weight:600;font-style:normal;font-display:swap}
CSS
echo "PASS: self-hosted Tailwind CSS and Montserrat fonts generated."
