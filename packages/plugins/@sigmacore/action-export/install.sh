#!/bin/bash

# Script de instalação para o plugin @sigmacore/action-export

echo "Instalando o plugin @sigmacore/action-export..."

# Verifica se está no diretório raiz do NocoBase
if [ ! -f "package.json" ] || ! grep -q "nocobase" package.json; then
  echo "❌ Este script deve ser executado no diretório raiz do NocoBase."
  exit 1
fi

# Verifica se o diretório do plugin existe
if [ ! -d "packages/plugins/@sigmacore/action-export" ]; then
  echo "❌ O diretório do plugin não foi encontrado em packages/plugins/@sigmacore/action-export"
  exit 1
fi

# Instalando dependências
echo "📦 Instalando dependências..."
cd packages/plugins/@sigmacore/action-export
yarn install

# Voltando para o diretório raiz
cd ../../../..

# Construindo o plugin
echo "🔨 Construindo o plugin..."
yarn build --filter @sigmacore/action-export

echo "✅ Plugin instalado com sucesso!"
echo ""
echo "Para ativar o plugin, vá para o painel de administração do NocoBase:"
echo "1. Acesse Configurações > Plugins"
echo "2. Encontre '@sigmacore/action-export' na lista"
echo "3. Clique em 'Ativar'"
echo ""
echo "Para usar o plugin, importe o componente em seus blocos personalizados:"
echo "import { ActionExport } from '@sigmacore/action-export';"
echo ""
echo "Consulte o arquivo USAGE.md para mais informações." 