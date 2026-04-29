# 🤖 Generador de Textos IA - Setup Rápido

## ⚡ Solo 2 Pasos

### 1️⃣ **Obtener API Key Gratis (5 min)**

Ve a: https://platform.openai.com/signup
- Regístrate SIN tarjeta de crédito
- Obtienes **$5 gratis** (~50,000 generaciones)
- Ve a https://platform.openai.com/api/keys
- Click "Create new secret key"
- Copia la clave

### 2️⃣ **Configurar Variable de Entorno**

Abre `.env.local` y reemplaza:
```
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

Por tu clave de OpenAI:
```
OPENAI_API_KEY=sk-proj-abc123def456xyz...
```

---

## 🚀 ¡Listo! Así se usa:

1. Ve al editor: `/editor/[slug]`
2. Verás botón ✨ en la esquina inferior derecha
3. Click y elige tipo de texto (título, descripción, SEO, botón)
4. Escribe qué quieres generar
5. Click "✨ Generar"
6. Copia el resultado y pégalo donde necesites

---

## 📁 Archivos Creados

```
app/api/ai/generate/route.ts          → Endpoint OpenAI
components/AIFloatingButton.tsx        → Botón flotante
.env.local                            → Clave API
```

---

## 💾 Cómo Funciona

```
Editor page
    ↓
Botón ✨ flotante (AIFloatingButton)
    ↓
Usuario escribe prompt
    ↓
Fetch a /api/ai/generate
    ↓
Llamada a OpenAI API
    ↓
Resultado mostrado en panel
    ↓
Usuario copia y pega
```

---

## ❌ Si hay error "API key inválida"

1. ¿Cambiaste `.env.local`? Si no, hazlo
2. ¿Tu clave empieza con `sk-proj-`? Si no, es incorrecta
3. ¿Tienes créditos en OpenAI? Ve a https://platform.openai.com/account/billing/overview

---

## 💰 Costos

| Uso | Coste |
|-----|-------|
| Prueba (gratis) | $0 |
| 50,000 gen | $5 (tus créditos) |
| Futuro (ilimitado) | $1-10/mes |

¡Listo! 🎉
