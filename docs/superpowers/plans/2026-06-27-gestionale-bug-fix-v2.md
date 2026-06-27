# Gestionale-Alice — Piano Fix Criticità v2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correggere tutte le criticità architetturali, bug funzionali e problemi di sicurezza identificati nell'analisi del 2026-06-27.

**Architecture:** Backend Node.js ESM su AWS Lambda (2 funzioni: API + scheduled stop). Frontend React + Vite. DynamoDB Single Table con GSI1 (per macchina) e GSI2 (per operatore). Fix ordinati per priorità discendente.

**Tech Stack:** Node.js ESM (`import/export`), AWS SDK v3 DynamoDB, AWS CDK TypeScript, React 18, Vite, react-hot-toast

## Global Constraints

- Runtime: Node.js ESM — nessun `require()`
- AWS SDK: `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` v3
- DynamoDB table: `process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign'`
- Prefissi PK: `CAR#`, `SESSION#`, `USER#`, `METADATA#`, `RATELIMIT#`
- Branch naming: `fix/<nome>` per ogni task
- Ogni task termina con commit e merge su `main`

---

## Stato fix

| # | Branch | Descrizione | Priorità | Stato |
|---|--------|-------------|----------|-------|
| 1 | `fix/total-minutes-model` | toApiModel → totalMinutes + ArchivioView | Critica | ⬜ |
| 2 | `fix/car-uuid` | UUID per ID macchine | Alta | ⬜ |
| 3 | `fix/button-disabled` | Disabilita bottone Avvia/Stop durante fetch | Alta | ⬜ |
| 4 | `fix/handler-safety` | JSON.parse try-catch + regione stopAllSessions | Alta | ⬜ |
| 5 | `fix/input-validation` | Validazione input backend (login/start/stop/create) | Alta | ⬜ |
| 6 | `fix/security-rate-limit` | Rate limiting su /api/auth/login | Alta | ⬜ |
| 7 | `fix/dead-code` | Rimuovi cognito.js, NewPasswordForm.jsx, MachineDetail.jsx | Media | ⬜ |
| 8 | `fix/useeffect-deps` | Fix useEffect deps + stabilizza filter useGetCars | Media | ⬜ |
| 9 | `fix/auto-refresh` | Polling automatico dati ogni 30s in OperatorView | Media | ⬜ |
| 10 | `fix/stop-shared-logic` | Refactoring logica stop() condivisa | Media | ⬜ |
| 11 | `fix/db-cleanup` | Rimuovi profile da db.js | Bassa | ⬜ |

---

## Task 1 — toApiModel totalMinutes + ArchivioView

**Branch:** `fix/total-minutes-model`

**Contesto:** `carService.js:7-18` mappa ancora `totalHours` (rimosso dalla migrazione) e `partialHours` (non più scritto). Il frontend riceve `machine.totalMinutes = undefined`. `ArchivioView.jsx:79-82` usa `machine.totalHours` → non mostra mai il totale nell'archivio.

**Files:**
- Modify: `api/services/carService.js:7-19`
- Modify: `frontend/src/components/ArchivioView.jsx:79-83`

**Interfaces:**
- Produce: `toApiModel(item)` restituisce `{ ..., totalMinutes: number }` invece di `totalHours`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/total-minutes-model
```

- [ ] **Step 2: Aggiorna toApiModel in carService.js**

In `api/services/carService.js`, sostituisci le righe 7-19:

```js
const toApiModel = (item) => ({
    id: item.PK.replace(CAR_PK_PREFIX, ''),
    name: (item.model || '') + " / " + (item.plate || ''),
    model: item.model,
    plate: item.plate,
    status: item.status,
    lavorazioni: item.lavorazioni,
    note: item.note,
    totalMinutes: item.totalMinutes ?? 0,
    photo: item.photo,
    assicurazione: item.assicurazione
});
```

- [ ] **Step 3: Aggiorna ArchivioView per usare totalMinutes**

In `frontend/src/components/ArchivioView.jsx`, sostituisci le righe 79-83:

```jsx
{machine.totalMinutes > 0 && (
  <p className="mt-1 text-sm font-semibold text-brand-text">
    Totale: {Math.floor(machine.totalMinutes / 60)}h {machine.totalMinutes % 60}m
  </p>
)}
```

- [ ] **Step 4: Verifica manuale**

Apri l'archivio macchine nel browser. Le macchine completate con `totalMinutes > 0` devono mostrare il totale ore/minuti.

- [ ] **Step 5: Commit e merge**

```bash
git add api/services/carService.js frontend/src/components/ArchivioView.jsx
git commit -m "fix: toApiModel mappa totalMinutes e ArchivioView mostra totale correttamente"
git checkout main && git merge fix/total-minutes-model
```

---

## Task 2 — UUID per ID macchine

**Branch:** `fix/car-uuid`

**Contesto:** `carService.js:52` usa `Date.now().toString()` come ID. Due richieste nello stesso millisecondo producono la stessa PK (`CAR#<timestamp>`), la seconda sovrascrive silenziosamente la prima. Stessa bug già fixata per le sessioni.

**Files:**
- Modify: `api/services/carService.js:52`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/car-uuid
```

- [ ] **Step 2: Sostituisci Date.now() con randomUUID()**

In `api/services/carService.js`, aggiungi l'import in cima:

```js
import { randomUUID } from 'crypto';
```

Poi alla riga 52, sostituisci:
```js
// Prima:
const id = Date.now().toString();

// Dopo:
const id = randomUUID();
```

- [ ] **Step 3: Verifica**

Crea due macchine in rapida successione nell'interfaccia admin. Entrambe devono apparire nella lista senza sovrascriversi.

- [ ] **Step 4: Commit e merge**

```bash
git add api/services/carService.js
git commit -m "fix: usa randomUUID() per ID macchine invece di Date.now()"
git checkout main && git merge fix/car-uuid
```

---

## Task 3 — Disabilita bottone Avvia/Stop durante fetch

**Branch:** `fix/button-disabled`

**Contesto:** `SelectedMachineView.jsx:118-127` — il bottone Avvia/Stop non ha `disabled` durante la fetch. Un doppio click rapido invia due richieste `start` o `stop` simultanee, causando doppia sessione o errori DB. I hook `useStartSession` e `useStopSession` espongono già `loading` ma non viene usato.

**Files:**
- Modify: `frontend/src/components/SelectedMachineView.jsx`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/button-disabled
```

- [ ] **Step 2: Aggiungi loading state agli hook**

In `SelectedMachineView.jsx`, modifica le dichiarazioni degli hook (righe 23-38) per destrutturare `loading`:

```js
const { execute: startSession, loading: isStarting } = useStartSession({
  onSuccess: (result) => {
    setIsWorking(true);
    if (result?.stoppedCars?.length > 0) {
      toast('Lavorazione precedente fermata automaticamente', { icon: '⚠️' });
    }
    if (onSessionChange) onSessionChange();
  }
});

const { execute: stopSession, loading: isStopping } = useStopSession({
  onSuccess: () => {
    setIsWorking(false);
    if (onSessionChange) onSessionChange();
  }
});
```

- [ ] **Step 3: Usa loading nel JSX**

Sostituisci il blocco del bottone (righe 115-127) con:

```jsx
{isCheckingSession ? (
  <div className="py-3 w-full rounded-lg border animate-pulse bg-brand-bg-300 border-brand-text-700" />
) : (
  <button
    onClick={handleWorkToggle}
    disabled={isStarting || isStopping}
    className={`py-3 w-full text-sm font-bold rounded-lg border shadow-sm transition uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed ${isWorking
        ? 'text-white bg-red-600 border-red-700 hover:bg-red-700'
        : 'text-brand-text-700 border-brand-text-700 hover:opacity-90'
      }`}
  >
    {(isStarting || isStopping) ? '...' : (isWorking ? 'Stop' : 'Avvia')}
  </button>
)}
```

- [ ] **Step 4: Verifica**

Clicca rapidamente due volte sul bottone Avvia. Deve apparire `...` dopo il primo click e il secondo click non deve fare nulla. Verifica che venga aperta una sola sessione.

- [ ] **Step 5: Commit e merge**

```bash
git add frontend/src/components/SelectedMachineView.jsx
git commit -m "fix: disabilita bottone Avvia/Stop durante fetch - previene doppio submit"
git checkout main && git merge fix/button-disabled
```

---

## Task 4 — Handler safety: JSON.parse + regione stopAllSessions

**Branch:** `fix/handler-safety`

**Contesto:**
1. `handler.js:16` — `JSON.parse(event.body)` non è in un try-catch: un body malformato lancia un'eccezione non gestita → risposta 500 invece di 400.
2. `stopAllSessionsHandler.js:4` — la regione hardcoded è `eu-central-1` mentre `db.js` usa `eu-south-1`. Inconsistente e potenzialmente errata in ambienti senza `AWS_REGION` settata.

**Files:**
- Modify: `api/handler.js:12-17`
- Modify: `api/stopAllSessionsHandler.js:1-8`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/handler-safety
```

- [ ] **Step 2: Wrappa JSON.parse in try-catch in handler.js**

In `api/handler.js`, sostituisci le righe 11-17:

```js
const event = req;
let body = {};
if (event.body) {
  if (typeof event.body === 'string') {
    try {
      body = JSON.parse(event.body);
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body' }), headers: { 'Content-Type': 'application/json' } };
    }
  } else {
    body = event.body;
  }
}
req = {
  method: event.requestContext?.http?.method,
  url: event.rawPath + (event.rawQueryString ? '?' + event.rawQueryString : ''),
  headers: event.headers || {},
  body,
};
```

- [ ] **Step 3: Fix regione in stopAllSessionsHandler.js**

In `api/stopAllSessionsHandler.js`, sostituisci le righe 1-7 con un import di `ddbDocClient` da `db.js` invece di creare un client locale:

```js
import ddbDocClient from './db.js';
import { ScanCommand, QueryCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';
const CAR_PK_PREFIX = 'CAR#';
const CAR_SK_PREFIX = 'METADATA#';
```

Rimuovi le righe 1-7 originali (DynamoDBClient, DynamoDBDocumentClient, client, ddbDocClient locali).

- [ ] **Step 4: Verifica handler body malformato**

Invia una richiesta POST con body non-JSON alla Lambda (o test locale):
```bash
curl -X POST https://<API_URL>/api/auth/login \
  -H "Content-Type: application/json" \
  -d "not-valid-json"
```
Risposta attesa: `400 { "error": "Invalid JSON in request body" }` invece di 500.

- [ ] **Step 5: Commit e merge**

```bash
git add api/handler.js api/stopAllSessionsHandler.js
git commit -m "fix: JSON.parse try-catch in handler + stopAllSessions usa db.js condiviso"
git checkout main && git merge fix/handler-safety
```

---

## Task 5 — Validazione input backend

**Branch:** `fix/input-validation`

**Contesto:** Nessun endpoint valida i campi obbligatori. Comportamenti errati attuali:
- `POST /api/auth/login` con `username` mancante → query con chiave `USER#undefined` → "User not found" invece di 400
- `POST /api/sessions/start` con `carId` o `operatorName` mancante → 500 con "User not logged in or invalid parameters" invece di 400 descrittivo
- `POST /api/cars` con `model` o `plate` mancanti → macchina creata con nome "/ " in DB

La validazione va fatta nel layer di routing (`routes.js` via middleware) o nei service. Scelta: aggiungi una funzione `validate()` in `handler.js` e usa `requireBody` nelle route definitions.

**Files:**
- Modify: `api/handler.js`
- Modify: `api/routes.js`
- Modify: `api/services/authService.js`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/input-validation
```

- [ ] **Step 2: Aggiungi validazione body nel handler**

In `api/handler.js`, dopo la sezione RBAC (riga ~68), aggiungi il check `requiredBody`:

```js
if (route.requiredBody) {
  const missing = route.requiredBody.filter(field => {
    const val = req.body[field];
    return val === undefined || val === null || val === '';
  });
  if (missing.length > 0) {
    res.status(400).json({ error: `Campi obbligatori mancanti: ${missing.join(', ')}` });
    return lambdaRes;
  }
}
```

Inserisci questo blocco dopo:
```js
if (route.requireAdmin && req.user?.role !== 'admin') {
  // ...
}
// ← QUI aggiungi il blocco requiredBody
const result = await route.handler(req);
```

- [ ] **Step 3: Aggiungi requiredBody alle route**

In `api/routes.js`, aggiorna le route:

```js
// Login
{ 
  path: '/api/auth/login', 
  method: 'POST', 
  handler: (req) => services.auth.login(req.body),
  requireAuth: false,
  requiredBody: ['username', 'password']
},

// Create car
{
  path: '/api/cars',
  method: 'POST',
  handler: (req) => services.cars.create(req, req.body),
  requireAuth: true,
  requireAdmin: true,
  requiredBody: ['model', 'plate']
},

// Start session
{
  path: '/api/sessions/start',
  method: 'POST',
  handler: (req) => services.workSessions.start(req, req.body.carId, req.body.operatorName),
  requireAuth: true,
  requiredBody: ['carId', 'operatorName']
},

// Stop session
{
  path: '/api/sessions/stop',
  method: 'POST',
  handler: (req) => services.workSessions.stop(req, req.body.carId, req.body.operatorName),
  requireAuth: true,
  requiredBody: ['carId', 'operatorName']
},
```

- [ ] **Step 4: Verifica**

```bash
# Login senza username → 400
curl -X POST https://<API_URL>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "test"}'
# Risposta: { "error": "Campi obbligatori mancanti: username" }

# Start senza carId → 400
curl -X POST https://<API_URL>/api/sessions/start \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"operatorName": "FLAVIU"}'
# Risposta: { "error": "Campi obbligatori mancanti: carId" }
```

- [ ] **Step 5: Commit e merge**

```bash
git add api/handler.js api/routes.js
git commit -m "fix: validazione input obbligatori via requiredBody nelle route"
git checkout main && git merge fix/input-validation
```

---

## Task 6 — Rate limiting su /api/auth/login

**Branch:** `fix/security-rate-limit`

**Contesto:** `/api/auth/login` non ha protezione brute force. Un attaccante può tentare infinite combinazioni di password. Fix: contatore di tentativi falliti per username in DynamoDB con TTL 15 minuti. Dopo 5 tentativi falliti → 429. Il contatore si azzera al login riuscito o allo scadere del TTL.

**Files:**
- Modify: `infrastructure/lib/backend-stack.ts` (abilita TTL sulla tabella)
- Create: `api/services/rateLimitService.js`
- Modify: `api/services/authService.js`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/security-rate-limit
```

- [ ] **Step 2: Abilita TTL sulla tabella DynamoDB in CDK**

In `infrastructure/lib/backend-stack.ts`, aggiungi `timeToLiveAttribute` alla definizione della tabella:

```typescript
const table = new cdk.aws_dynamodb.Table(this, 'PanzaniDesignTable', {
  tableName: 'PanzaniDesign',
  partitionKey: { name: 'PK', type: cdk.aws_dynamodb.AttributeType.STRING },
  sortKey: { name: 'SK', type: cdk.aws_dynamodb.AttributeType.STRING },
  billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  timeToLiveAttribute: 'ttl',  // ← aggiunto
});
```

**Nota:** `timeToLiveAttribute` non richiede un re-create della tabella — CDK lo applica come update in-place. Il TTL è best-effort: gli item scaduti vengono eliminati entro ~48h, ma il codice controlla manualmente il campo `ttl` per blocco immediato.

- [ ] **Step 3: Crea rateLimitService.js**

Crea `api/services/rateLimitService.js`:

```js
import ddbDocClient from '../db.js';
import { GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';
const RATELIMIT_PREFIX = 'RATELIMIT#';
const RATELIMIT_SK = 'METADATA#';
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 900; // 15 minuti

export async function checkRateLimit(username) {
  const { Item } = await ddbDocClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: `${RATELIMIT_PREFIX}${username}`, SK: RATELIMIT_SK },
  }));

  if (!Item) return; // nessun tentativo precedente
  if (Item.failCount >= MAX_ATTEMPTS && Item.ttl > Math.floor(Date.now() / 1000)) {
    const retryAfter = Item.ttl - Math.floor(Date.now() / 1000);
    const err = new Error(`Troppi tentativi. Riprova tra ${Math.ceil(retryAfter / 60)} minuti.`);
    err.statusCode = 429;
    throw err;
  }
}

export async function recordFailedAttempt(username) {
  const ttl = Math.floor(Date.now() / 1000) + WINDOW_SECONDS;
  await ddbDocClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: `${RATELIMIT_PREFIX}${username}`, SK: RATELIMIT_SK },
    UpdateExpression: 'SET failCount = if_not_exists(failCount, :zero) + :one, #ttl = :ttl',
    ExpressionAttributeNames: { '#ttl': 'ttl' },
    ExpressionAttributeValues: { ':zero': 0, ':one': 1, ':ttl': ttl },
  }));
}

export async function clearRateLimit(username) {
  await ddbDocClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { PK: `${RATELIMIT_PREFIX}${username}`, SK: RATELIMIT_SK },
  }));
}
```

- [ ] **Step 4: Integra rateLimitService in authService.js**

In `api/services/authService.js`, aggiungi gli import e integra i check:

```js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import ddbDocClient from "../db.js";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { USER_PK_PREFIX, USER_SK_PREFIX } from '../entities/user.js';
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from './rateLimitService.js';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';

export default function authService() {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) throw new Error('JWT_SECRET must be set');
    return {
        login: async ({ username, password }) => {
            // 1. Controlla rate limit prima di qualsiasi operazione DB
            await checkRateLimit(username);

            const data = await ddbDocClient.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `${USER_PK_PREFIX}${username}`,
                    SK: USER_SK_PREFIX
                }
            }));
            const user = data.Item;

            if (!user) {
                await recordFailedAttempt(username);
                throw new Error('User not found');
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                await recordFailedAttempt(username);
                throw new Error('Invalid credentials');
            }

            // Login riuscito: azzera il contatore
            await clearRateLimit(username);

            const token = jwt.sign(
                { id: user.PK, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: '8h' }
            );

            return { token, user: { username: user.username, role: user.role } };
        }
    };
}
```

- [ ] **Step 5: Gestisci statusCode 429 in handler.js**

In `api/handler.js`, nel blocco catch principale, aggiungi il caso 429:

```js
} catch (error) {
  console.error('API Error:', error);
  const isAuthError = error.message === 'User not found' || error.message === 'Invalid credentials';
  const isTooManyRequests = error.statusCode === 429;
  const statusCode = isTooManyRequests ? 429 : isAuthError ? 401 : 500;
  const clientMessage = (isTooManyRequests || isAuthError) ? error.message : 'Internal server error';
  res.status(statusCode).json({ error: clientMessage });
  return lambdaRes;
}
```

- [ ] **Step 6: Deploy CDK per abilitare TTL**

```bash
cd infrastructure && npx cdk deploy
```

Output atteso: `Update complete. Resources updated: 1 (PanzaniDesignTable TTL enabled)`.

- [ ] **Step 7: Verifica**

```bash
# 5 tentativi falliti (sostituisci URL)
for i in 1 2 3 4 5 6; do
  curl -s -X POST https://<API_URL>/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}' | jq .
done
# Al 6° tentativo: { "error": "Troppi tentativi. Riprova tra 15 minuti." } con status 429
```

- [ ] **Step 8: Commit e merge**

```bash
git add infrastructure/lib/backend-stack.ts api/services/rateLimitService.js api/services/authService.js api/handler.js
git commit -m "feat: rate limiting su /api/auth/login - blocco dopo 5 tentativi falliti in 15min"
git checkout main && git merge fix/security-rate-limit
```

---

## Task 7 — Pulizia dead code

**Branch:** `fix/dead-code`

**Contesto:** Tre file non sono importati da nessuna parte e contengono codice che non funziona:
- `cognito.js`: lancia `throw new Error` all'import se `VITE_COGNITO_USER_POOL_ID` non è settata (env var Cognito non usata) — crash garantito se qualcuno la importasse
- `NewPasswordForm.jsx`: usa `completeNewPassword` dal context che non esiste in `AuthContext.jsx` — crash garantito al submit
- `MachineDetail.jsx`: `handleStartStop`, `handleFinish`, `handleSave` mostrano solo toast senza chiamate API reali

**Files:**
- Delete: `frontend/src/utils/cognito.js`
- Delete: `frontend/src/pages/NewPasswordForm.jsx`
- Delete: `frontend/src/components/MachineDetail.jsx`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/dead-code
```

- [ ] **Step 2: Verifica che i file non siano importati**

```bash
grep -r "cognito\|NewPasswordForm\|MachineDetail" \
  frontend/src --include="*.jsx" --include="*.js" \
  --exclude="cognito.js" \
  --exclude="NewPasswordForm.jsx" \
  --exclude="MachineDetail.jsx"
```

Output atteso: nessuna riga. Se c'è output, investigate prima di procedere.

- [ ] **Step 3: Elimina i file**

```bash
git rm frontend/src/utils/cognito.js
git rm frontend/src/pages/NewPasswordForm.jsx
git rm frontend/src/components/MachineDetail.jsx
```

- [ ] **Step 4: Commit e merge**

```bash
git commit -m "chore: rimuovi dead code (cognito.js, NewPasswordForm, MachineDetail)"
git checkout main && git merge fix/dead-code
```

---

## Task 8 — Fix useEffect deps + stabilizza filter useGetCars

**Branch:** `fix/useeffect-deps`

**Contesto:**
1. `SelectedMachineView.jsx:48` — `checkActiveSessions` è mancante dalle deps dell'useEffect. È una stable reference (`useCallback`) quindi non causa bug ora, ma viola le rules of hooks.
2. `OperatorView.jsx:37`, `OfficinaView.jsx:41`, `ArchivioView.jsx:35` — `useEffect(fn, [])` con `refreshAll`/`fetchMachines` nelle deps mancanti. Funziona perché le funzioni sono stable, ma è fragile.
3. `useGetCars` accetta un `filter` prop che viene messo nelle deps di `useCallback(execute)`. Se il chiamante passa una arrow inline, `execute` viene ricreato ogni render. Soluzione: rimuovi `filter` da `useGetCars`, applica il filtro nell'`onSuccess` dei chiamanti.

**Files:**
- Modify: `frontend/src/hooks/useCars.js`
- Modify: `frontend/src/components/SelectedMachineView.jsx:46-48`
- Modify: `frontend/src/pages/OperatorView.jsx:25-37`
- Modify: `frontend/src/components/OfficinaView.jsx:23-41`
- Modify: `frontend/src/components/ArchivioView.jsx:22-35`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/useeffect-deps
```

- [ ] **Step 2: Rimuovi il filter da useGetCars**

In `frontend/src/hooks/useCars.js`, rimuovi il parametro `filter` e la logica correlata. La nuova `useGetCars`:

```js
export const useGetCars = ({ onSuccess, onError } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}${API_ENDPOINTS.CARS}`);
      if (!response.ok) throw new Error('Errore nel caricamento delle macchine');
      const result = await response.json();
      setData(result);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      setError(err.message);
      if (onError) onError(err);
      else toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  return { execute, loading, error, data };
};
```

- [ ] **Step 3: Aggiorna OperatorView.jsx**

In `frontend/src/pages/OperatorView.jsx`, sostituisci le righe 25-37:

```js
const { execute: fetchMachines, loading: isLoading } = useGetCars({
  onSuccess: (data) => setMachines(data.filter(m => m.status !== 'completed'))
});

const refreshAll = useCallback(() => {
  fetchMachines();
  fetchAllActive();
}, [fetchMachines, fetchAllActive]);

useEffect(() => {
  refreshAll();
}, [refreshAll]);
```

- [ ] **Step 4: Aggiorna OfficinaView.jsx**

In `frontend/src/components/OfficinaView.jsx`, sostituisci le righe 23-41:

```js
const { execute: fetchMachines, loading: isLoading } = useGetCars({
  onSuccess: (data) => {
    const active = data.filter(m => m.status !== 'completed');
    setMachines(active);
    if (selectedMachine) {
      const updated = active.find(m => m.id === selectedMachine.id);
      if (updated) setSelectedMachine(updated);
      else { setSelectedMachine(null); setShowDetail(false); }
    }
  }
});

useEffect(() => {
  fetchMachines();
}, [fetchMachines]);
```

- [ ] **Step 5: Aggiorna ArchivioView.jsx**

In `frontend/src/components/ArchivioView.jsx`, sostituisci le righe 22-35:

```js
const { execute: fetchMachines, loading: isLoading } = useGetCars({
  onSuccess: (data) => {
    const completed = data.filter(m => m.status === 'completed');
    setMachines(completed);
    if (selectedMachine && !completed.find(m => m.id === selectedMachine.id)) {
      setSelectedMachine(null);
      setShowDetail(false);
    }
  }
});

useEffect(() => {
  fetchMachines();
}, [fetchMachines]);
```

- [ ] **Step 6: Fix dep mancante in SelectedMachineView.jsx**

In `frontend/src/components/SelectedMachineView.jsx`, righe 46-48:

```js
useEffect(() => {
  checkActiveSessions(selectedMachine.id);
}, [selectedMachine.id, operatorName, checkActiveSessions]);
```

- [ ] **Step 7: Verifica**

Naviga tra le tre viste (Officina, Operatori, Archivio). I dati devono caricarsi correttamente. Non devono esserci loop infiniti (network tab deve mostrare una sola chiamata per fetch iniziale).

- [ ] **Step 8: Commit e merge**

```bash
git add frontend/src/hooks/useCars.js \
  frontend/src/components/SelectedMachineView.jsx \
  frontend/src/pages/OperatorView.jsx \
  frontend/src/components/OfficinaView.jsx \
  frontend/src/components/ArchivioView.jsx
git commit -m "fix: rimuovi filter da useGetCars + deps mancanti useEffect"
git checkout main && git merge fix/useeffect-deps
```

---

## Task 9 — Auto-refresh polling

**Branch:** `fix/auto-refresh`

**Contesto:** I dati sono caricati una sola volta al mount. In un contesto multi-utente (admin + 5 operatori), le modifiche degli operatori non appaiono nella vista admin senza refresh manuale. Fix: polling ogni 30s in `OperatorView` (la vista che lo admin usa per monitorare). Il polling usa lo stesso `refreshAll` già esistente.

**Files:**
- Modify: `frontend/src/pages/OperatorView.jsx`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/auto-refresh
```

- [ ] **Step 2: Aggiungi polling in OperatorView**

In `frontend/src/pages/OperatorView.jsx`, aggiungi `useRef` agli import (già presente `useCallback`, `useEffect`):

```js
import { useState, useEffect, useCallback, useRef } from 'react';
```

Dopo il blocco `useEffect` che chiama `refreshAll()`, aggiungi il polling:

```js
useEffect(() => {
  refreshAll();
}, [refreshAll]);

// Polling: aggiorna i dati ogni 30s
useEffect(() => {
  const interval = setInterval(refreshAll, 30_000);
  return () => clearInterval(interval);
}, [refreshAll]);
```

- [ ] **Step 3: Verifica**

Apri la vista Operatori in un tab. In un altro tab (come operatore), avvia una lavorazione. Entro 30 secondi, la vista admin deve mostrarsi aggiornata senza refresh manuale. Verifica nel Network tab che le chiamate avvengano ogni ~30s.

- [ ] **Step 4: Commit e merge**

```bash
git add frontend/src/pages/OperatorView.jsx
git commit -m "feat: polling automatico ogni 30s in OperatorView"
git checkout main && git merge fix/auto-refresh
```

---

## Task 10 — Refactoring logica stop() condivisa

**Branch:** `fix/stop-shared-logic`

**Contesto:** La logica "aggiorna `totalMinutes` + aggiorna `status` macchina" dopo la chiusura di una sessione è implementata due volte:
- `workSessionService.js:130-163` — in `stop()`
- `stopAllSessionsHandler.js:48-83` — nel loop per ogni car

Le due implementazioni devono restare in sync manualmente. Soluzione: estrai `finalizeCarAfterStop()` come funzione esportata da `workSessionService.js` e importala in `stopAllSessionsHandler.js`. Dopo il Task 4 (che fa già usare `db.js` da `stopAllSessionsHandler`), questo è un semplice extract.

**Files:**
- Modify: `api/services/workSessionService.js`
- Modify: `api/stopAllSessionsHandler.js`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/stop-shared-logic
```

- [ ] **Step 2: Estrai finalizeCarAfterStop da workSessionService.js**

In `api/services/workSessionService.js`, aggiungi questa funzione **esportata** prima della funzione `workSessionService()` e prima del `return`:

```js
// Aggiorna totalMinutes e status macchina dopo la chiusura di sessioni.
// allSessions: tutte le sessioni della macchina (dal DB, pre-write).
// closedDurationMap: Map<PK, durationMinutes> delle sessioni appena chiuse in memoria.
export async function finalizeCarAfterStop(carId, allSessions, closedDurationMap) {
  const totalMins = allSessions.reduce((acc, s) => {
    return acc + (closedDurationMap.has(s.PK) ? closedDurationMap.get(s.PK) : (s.durationMinutes || 0));
  }, 0);

  await ddbDocClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: `${CAR_PK_PREFIX}${carId}`, SK: CAR_SK_PREFIX },
    UpdateExpression: 'set totalMinutes = :tm',
    ExpressionAttributeValues: { ':tm': totalMins },
  }));

  try {
    await ddbDocClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `${CAR_PK_PREFIX}${carId}`, SK: CAR_SK_PREFIX },
      UpdateExpression: 'set #s = :waiting',
      ConditionExpression: '#s <> :completed',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':waiting': 'waiting', ':completed': 'completed' },
    }));
  } catch (e) {
    if (e.name !== 'ConditionalCheckFailedException') throw e;
  }
}
```

- [ ] **Step 3: Usa finalizeCarAfterStop in workSessionService.stop()**

In `workSessionService.js`, nella funzione `stop()`, sostituisci il blocco `totalMins` + i due `UpdateCommand` (righe ~134-162) con:

```js
const allSessions = allSessionsData.Items || [];
const closedDurationMap = new Map([[activeSession.PK, durationMinutes]]);
await finalizeCarAfterStop(carId, allSessions, closedDurationMap);
```

- [ ] **Step 4: Usa finalizeCarAfterStop in stopAllSessionsHandler.js**

In `api/stopAllSessionsHandler.js`, aggiungi l'import:

```js
import { finalizeCarAfterStop } from './services/workSessionService.js';
```

Poi sostituisci il loop `for (const carId of carIds)` (righe 48-83) con:

```js
for (const carId of carIds) {
  const { Items: allSessions = [] } = await ddbDocClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :carPk',
    ExpressionAttributeValues: { ':carPk': `${CAR_PK_PREFIX}${carId}` },
  }));
  await finalizeCarAfterStop(carId, allSessions, closedDurationMap);
}
```

- [ ] **Step 5: Verifica**

Avvia alcune sessioni come operatori diversi. Attendi le 18:30 (o triggera la Lambda manualmente via AWS Console) e verifica che `totalMinutes` e `status` vengano aggiornati correttamente. In alternativa, testa `workSessionService.stop()` avviando e fermando una sessione manualmente.

- [ ] **Step 6: Commit e merge**

```bash
git add api/services/workSessionService.js api/stopAllSessionsHandler.js
git commit -m "refactor: estrai finalizeCarAfterStop - elimina duplicazione logica stop"
git checkout main && git merge fix/stop-shared-logic
```

---

## Task 11 — Pulizia db.js (profile inutile)

**Branch:** `fix/db-cleanup`

**Contesto:** `api/db.js:4` ha `profile: 'PanzaniDesign'` nel costruttore del client DynamoDB. In Lambda, le credenziali vengono da IAM role — `profile` viene ignorato. Il parametro confonde chi legge il codice e potrebbe causare problemi in ambienti dove il profilo non esiste.

**Files:**
- Modify: `api/db.js:4`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/db-cleanup
```

- [ ] **Step 2: Rimuovi profile da db.js**

In `api/db.js`, sostituisci la riga 4:

```js
// Prima:
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-south-1', profile: 'PanzaniDesign' });

// Dopo:
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-south-1' });
```

- [ ] **Step 3: Commit e merge**

```bash
git add api/db.js
git commit -m "chore: rimuovi profile inutile da db.js - Lambda usa IAM role"
git checkout main && git merge fix/db-cleanup
```

---

## Ordine di esecuzione raccomandato

```
Task 1  (totalMinutes)       → merge → deploy
Task 2  (UUID macchine)      → merge → deploy
Task 3  (bottone disabled)   → merge (solo frontend)
Task 4  (handler safety)     → merge → deploy ← richiede questo prima del Task 10
Task 5  (validazione input)  → merge → deploy
Task 6  (rate limiting)      → merge → CDK deploy → deploy Lambda
Task 7  (dead code)          → merge (solo frontend)
Task 8  (useEffect deps)     → merge (solo frontend)
Task 9  (auto-refresh)       → merge (solo frontend)
Task 10 (stop condiviso)     → merge → deploy ← richiede Task 4 già mergato
Task 11 (db cleanup)         → merge → deploy
```

I task 1, 2, 4, 5, 6, 10, 11 toccano il backend e richiedono deploy Lambda.
I task 3, 7, 8, 9 toccano solo il frontend — nessun deploy Lambda.
Il Task 6 richiede CDK deploy per il TTL sulla tabella DynamoDB.
Il Task 10 richiede il Task 4 già mergato (per usare `db.js` condiviso in `stopAllSessionsHandler`).
