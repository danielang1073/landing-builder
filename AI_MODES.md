# 🔄 Cambiar entre Modo Mock y OpenAI

## 📍 Situación Actual

```
AI_MODE=mock    (hoy, gratis)
```

El panel mostrará: **🆓 Modo: Mock (Gratis)**

---

## 🚀 Cuando Tengas Dinero (Futuro)

### Paso 1: Agregar Tarjeta a OpenAI
1. Ve a: https://platform.openai.com/account/billing/overview
2. Click "Add payment method"
3. Agrega tu tarjeta de crédito

### Paso 2: Cambiar Modo en `.env.local`

Abre `.env.local` y cambia:

```diff
- AI_MODE=mock
+ AI_MODE=openai
```

### Paso 3: Reinicia el Servidor

```bash
npm run dev
```

### Paso 4: Listo

Ahora usará OpenAI en lugar de Mock Data.

El panel mostrará: **💰 Modo: OpenAI (Pagado)**

---

## 💡 Resumen

| Modo | Costo | Velocidad | Realismo |
|------|-------|-----------|----------|
| **mock** | $0 | Instantáneo ⚡ | 80% |
| **openai** | $0.0001/generación | Normal | 100% |

---

## 🔐 Tu API Key

Ya está configurada en `.env.local`:
```
OPENAI_API_KEY=sk-proj-...
```

Solo necesitas:
1. Agregar tarjeta a OpenAI (cuando quieras)
2. Cambiar `AI_MODE=openai`
3. Listo

---

## ❓ Preguntas

**¿Qué pasa si no tengo dinero?**
→ Usa `AI_MODE=mock` (gratis para siempre)

**¿Puedo volver a mock si se me acaba el dinero?**
→ Sí, solo cambia `AI_MODE=mock`

**¿Cuánto cuesta usar OpenAI?**
→ ~$0.0001 por generación = $1 por 10,000 generaciones
