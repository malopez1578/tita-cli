#!/bin/bash

# TITA CLI Publishing Script
# Este script automatiza el proceso de publicación en npm

set -e

echo "🚀 TITA CLI Publishing Script"
echo "=============================="

# Check if we're logged into npm
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ No estás logueado en npm. Ejecuta 'npm login' primero."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ No se encontró package.json. Asegúrate de estar en el directorio correcto."
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Tienes cambios no commiteados. Commitea todos los cambios antes de publicar."
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📋 Versión actual: $CURRENT_VERSION"

# Ask for version bump type
echo ""
echo "Selecciona el tipo de versión:"
echo "1) patch (1.0.0 -> 1.0.1) - Bug fixes"
echo "2) minor (1.0.0 -> 1.1.0) - New features"
echo "3) major (1.0.0 -> 2.0.0) - Breaking changes"
echo "4) Especificar versión manualmente"
echo ""

read -p "Opción (1-4): " version_choice

case $version_choice in
    1)
        VERSION_TYPE="patch"
        ;;
    2)
        VERSION_TYPE="minor"
        ;;
    3)
        VERSION_TYPE="major"
        ;;
    4)
        read -p "Especifica la nueva versión (ej: 1.2.3): " NEW_VERSION
        VERSION_TYPE=""
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "🔧 Preparando publicación..."

# Clean and build
echo "🧹 Limpiando archivos anteriores..."
npm run clean

echo "🔨 Compilando proyecto..."
npm run build

# Bump version
if [ -n "$VERSION_TYPE" ]; then
    echo "📈 Incrementando versión ($VERSION_TYPE)..."
    npm version $VERSION_TYPE
    NEW_VERSION=$(node -p "require('./package.json').version")
else
    echo "📝 Estableciendo versión $NEW_VERSION..."
    npm version $NEW_VERSION
fi

echo "✅ Nueva versión: $NEW_VERSION"

# Create git tag
echo "🏷️  Creando tag de Git..."
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"

# Publish to npm
echo "📦 Publicando en npm..."
npm publish --access public

echo ""
echo "🎉 ¡Publicación exitosa!"
echo "📋 Versión: $NEW_VERSION"
echo "🌐 Disponible en: https://www.npmjs.com/package/@malopez1578/tita-cli"
echo ""
echo "📋 Siguientes pasos:"
echo "1. Push el tag a GitHub: git push origin v$NEW_VERSION"
echo "2. Crear un release en GitHub con el changelog"
echo "3. Anunciar la nueva versión"
