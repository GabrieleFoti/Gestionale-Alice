# Gestionale-Alice — Piano Fix Architetturali

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correggere tutti i problemi critici e strutturali identificati nell'analisi architetturale del 2026-06-26, migliorando sicurezza, consistenza dei dati e qualità del codice.

**Architecture:** Backend Node.js ESM su AWS Lambda con DynamoDB Single Table Design. Frontend React con Vite. Ogni fix viene sviluppato su branch dedicato e mergato su `main` dopo verifica.

**Tech Stack:** Node.js (ESM), AWS SDK v3 DynamoDB, AWS CDK (TypeScript), React, Vite, react-hot-toast

## Global Constraints

- Runtime: Node.js ESM (`import/export`), nessun `require()`
- AWS SDK: `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` v3
- DynamoDB table: `process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign'`
- Prefissi entità: `CAR#`, `SESSION#`, `USER#`, `METADATA#`
- Nessun ORM: tutti gli accessi DB sono comandi SDK diretti
- Branch naming: `fix/<nome>` per ogni task

---

## Stato fix

| # | Branch | Descrizione | Priorità | Stato |
|---|--------|-------------|----------|-------|
| 1 | `fix/bcrypt-passwords` | bcrypt + JWT expiry | Critica | ⬜ |
| 2 | `fix/session-uuid` | UUID per PK sessioni | Alta | ⬜ |
| 3 | `fix/eventual-consistency` | ConsistentRead in stop() | Alta | ⬜ |
| 4 | `fix/total-hours-integer` | totalHours come intero + migrazione dati | Alta | ⬜ |
| 5 | `fix/gsi2-operator` | GSI2 operatore + elimina Scan | Alta | ⬜ |
| 6 | `fix/rbac-admin-routes` | RBAC sulle route admin | Media | ⬜ |
| 7 | `fix/hook-factory` | Hook factory frontend (elimina duplicati) | Media | ⬜ |
| 8 | `fix/abort-controller` | AbortController negli hook | Bassa | ⬜ |
| 9 | `fix/isworking-flash` | Skeleton state per isWorking | Bassa | ⬜ |
| 10 | `fix/atomic-transactions` | TransactWriteItems per start/stop | Media | ⬜ |

---

## Task 1 — bcrypt + JWT expiry

**Branch:** `fix/bcrypt-passwords`

**Contesto:** `authService.js:26` confronta le password in plaintext (`password === user.password`). `bcrypt` è già importato ma non usato. I JWT non hanno scadenza.

**Files:**
- Modify: `api/services/authService.js`
- Create: `api/scripts/migrate-passwords.js`

**Interfacce:**
- Produce: `authService.login(body)` che usa `bcrypt.compare()` e firma JWT con `expiresIn: '8h'`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/bcrypt-passwords
```

- [ ] **Step 2: Leggi authService.js corrente**
```bash
cat api/services/authService.js
```
Individua la riga con `password === user.password` e quella con `jwt.sign`.

- [ ] **Step 3: Correggi il confronto password e aggiungi expiry**

Modifica `api/services/authService.js`:
```js
// Prima (SBAGLIATO):
const isValid = password === user.password;

// Dopo (CORRETTO):
const isValid = await bcrypt.compare(password, user.password);
```

Modifica `jwt.sign`:
```js
// Prima:
const token = jwt.sign({ username, role: user.role }, JWT_SECRET);

// Dopo:
const token = jwt.sign({ username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
```

- [ ] **Step 4: Crea lo script di migrazione password**

Crea `api/scripts/migrate-passwords.js`:
```js
import ddbDocClient from '../db.js';
import { ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';

const { Items: users = [] } = await ddbDocClient.send(new ScanCommand({
  TableName: TABLE_NAME,
  FilterExpression: '#t = :userType',
  ExpressionAttributeNames: { '#t': 'type' },
  ExpressionAttributeValues: { ':userType': 'USER' },
}));

for (const user of users) {
  // Salta utenti già migrati (hash bcrypt inizia con $2a$ o $2b$)
  if (user.password.startsWith('$2')) {
    console.log(`✓ ${user.username} già hashato, skip`);
    continue;
  }
  const hashed = await bcrypt.hash(user.password, 10);
  await ddbDocClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: { ...user, password: hashed },
  }));
  console.log(`✓ ${user.username} migrato`);
}
console.log('Migrazione completata.');
```

- [ ] **Step 5: Esegui la migrazione**
```bash
cd api && node scripts/migrate-passwords.js
```
Output atteso: una riga `✓ <username> migrato` per ogni utente.

- [ ] **Step 6: Verifica manuale**

Avvia l'API locale (se disponibile) e testa il login con le credenziali esistenti. Deve restituire un token JWT.

- [ ] **Step 7: Commit e PR**
```bash
git add api/services/authService.js api/scripts/migrate-passwords.js
git commit -m "fix: usa bcrypt.compare per password e aggiunge JWT expiry 8h"
gh pr create --title "fix: bcrypt passwords + JWT expiry" --body "Corregge confronto password plaintext e aggiunge scadenza 8h al token JWT."
```

---

## Task 2 — UUID per PK sessioni

**Branch:** `fix/session-uuid`

**Contesto:** `entities/workSession.js:8` usa `Date.now()` come fallback per il PK. Due richieste nello stesso millisecondo producono la stessa PK, la seconda sovrascrive silenziosamente la prima.

**Files:**
- Modify: `api/entities/workSession.js`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/session-uuid
```

- [ ] **Step 2: Sostituisci Date.now() con crypto.randomUUID()**

`crypto` è built-in in Node.js 16+, nessuna dipendenza aggiuntiva.

Modifica `api/entities/workSession.js`:
```js
import { randomUUID } from 'crypto';
import { CAR_PK_PREFIX } from './car.js';

export const SESSION_PK_PREFIX = 'SESSION#';
export const SESSION_SK_PREFIX = 'METADATA#';

export const toSessionItem = (session) => ({
  PK: `${SESSION_PK_PREFIX}${session.id || randomUUID()}`,
  SK: SESSION_SK_PREFIX,
  GSI1PK: `${CAR_PK_PREFIX}${session.carId}`,
  GSI1SK: session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime,
  type: 'SESSION',
  ...session
});
```

- [ ] **Step 3: Commit e PR**
```bash
git add api/entities/workSession.js
git commit -m "fix: usa randomUUID() per PK sessioni invece di Date.now()"
gh pr create --title "fix: UUID per PK sessioni" --body "Elimina la race condition dove due richieste nello stesso millisecondo producevano la stessa PK."
```

---

## Task 3 — Eventual consistency in stop()

**Branch:** `fix/eventual-consistency`

**Contesto:** In `workSessionService.js:stop()`, dopo il `PutCommand` che aggiunge `endTime` alla sessione, la `QueryCommand` successiva usa il GSI1 che è eventually consistent. La sessione appena fermata potrebbe non avere ancora `endTime` nel risultato, lasciando la macchina erroneamente in stato `in_progress` e calcolando `totalHours` sbagliato.

**Files:**
- Modify: `api/services/workSessionService.js`

**Soluzione:** Calcolare `totalHours` e `remainingActive` dai dati in memoria invece di fare una seconda query al GSI — abbiamo già tutti i dati necessari dalla prima query e dal PutCommand.

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/eventual-consistency
```

- [ ] **Step 2: Refactoring di stop() per eliminare la seconda query**

Nella funzione `stop()` in `api/services/workSessionService.js`, sostituisci la sezione che va dalla riga del PutCommand fino alla fine della funzione:

```js
async function stop(req, carId, operatorName) {
  if (!req.user || !carId || !operatorName) {
    throw new Error('User not logged in or invalid parameters');
  }

  // Find active session
  const params = {
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :carPk',
    FilterExpression: 'attribute_not_exists(endTime)',
    ExpressionAttributeValues: {
      ':carPk': `${CAR_PK_PREFIX}${carId}`,
      ':opName': operatorName
    }
  };

  // Legge TUTTE le sessioni della macchina (attive e non) per calcolare totalHours
  const allSessionsParams = {
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :carPk',
    ExpressionAttributeValues: { ':carPk': `${CAR_PK_PREFIX}${carId}` },
  };

  // Esegui entrambe le query in parallelo prima di modificare nulla
  const [activeData, allSessionsData] = await Promise.all([
    ddbDocClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :carPk',
      FilterExpression: 'operatorName = :opName AND attribute_not_exists(endTime)',
      ExpressionAttributeValues: {
        ':carPk': `${CAR_PK_PREFIX}${carId}`,
        ':opName': operatorName
      }
    })),
    ddbDocClient.send(new QueryCommand(allSessionsParams)),
  ]);

  if (!activeData.Items || activeData.Items.length === 0) return null;

  const activeSession = activeData.Items[0];
  const endTime = new Date().toISOString();
  const durationMinutes = Math.floor((new Date(endTime) - new Date(activeSession.startTime)) / 60000);

  const closedSession = { ...activeSession, endTime, durationMinutes };

  await ddbDocClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: closedSession,
  }));

  // Calcola totalHours in memoria (no seconda query GSI — eventually consistent)
  const allSessions = allSessionsData.Items || [];
  const totalMins = allSessions.reduce((acc, s) => {
    if (s.PK === activeSession.PK) return acc + durationMinutes; // usa il valore calcolato ora
    return acc + (s.durationMinutes || 0);
  }, 0);
  const totalHoursStr = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;

  await ddbDocClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: `${CAR_PK_PREFIX}${carId}`, SK: CAR_SK_PREFIX },
    UpdateExpression: 'set totalHours = :th',
    ExpressionAttributeValues: { ':th': totalHoursStr },
  }));

  // Controlla se ci sono altre sessioni attive sulla stessa macchina (in memoria)
  const remainingActive = allSessions.filter(s => !s.endTime && s.PK !== activeSession.PK);
  if (remainingActive.length === 0) {
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

  return closedSession;
}
```

- [ ] **Step 3: Applica la stessa fix a stopAllSessionsHandler.js**

In `api/stopAllSessionsHandler.js`, la sezione che ricalcola `totalHours` dopo la chiusura ha lo stesso potenziale problema. Sostituisci la logica che usa `allSessions` dalla seconda query con un calcolo in memoria basato su `activeSessions` già lette:

```js
// Invece di fare una nuova QueryCommand per ogni car, calcola in memoria
const carIds = [...new Set(activeSessions.map(s => s.carId))];
const endTime = new Date().toISOString();

// Prima chiudi tutte le sessioni e tieni traccia delle durate calcolate
const closedSessions = activeSessions.map(session => ({
  ...session,
  endTime,
  durationMinutes: Math.floor((new Date(endTime) - new Date(session.startTime)) / 60000),
}));

for (const session of closedSessions) {
  await ddbDocClient.send(new PutCommand({ TableName: TABLE_NAME, Item: session }));
}

// Per ogni macchina, recupera tutte le sessioni (incluse quelle storiche non attive)
for (const carId of carIds) {
  const { Items: allSessions = [] } = await ddbDocClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :carPk',
    ExpressionAttributeValues: { ':carPk': `${CAR_PK_PREFIX}${carId}` },
  }));

  // Usa durationMinutes calcolato in memoria per le sessioni appena chiuse
  const closedMap = new Map(closedSessions.map(s => [s.PK, s.durationMinutes]));
  const totalMins = allSessions.reduce((acc, s) => {
    return acc + (closedMap.has(s.PK) ? closedMap.get(s.PK) : (s.durationMinutes || 0));
  }, 0);

  const totalHoursStr = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
  // ... resto uguale
}
```

- [ ] **Step 4: Commit e PR**
```bash
git add api/services/workSessionService.js api/stopAllSessionsHandler.js
git commit -m "fix: elimina eventual consistency bug in stop() - calcolo totalHours in memoria"
gh pr create --title "fix: eventual consistency in stop()" --body "Calcola totalHours e remainingActive in memoria invece di fare una seconda query GSI eventually consistent."
```

---

## Task 4 — totalHours come intero

**Branch:** `fix/total-hours-integer`

**Contesto:** `totalHours` è salvato come stringa `"1h 30m"` in DynamoDB. Impossibile da aggregare, ordinare o usare in calcoli. Va cambiato in `totalMinutes` (intero). Richiede migrazione dati + aggiornamento di tutti i punti che leggono/scrivono questo campo.

**Files:**
- Modify: `api/services/workSessionService.js`
- Modify: `api/stopAllSessionsHandler.js`
- Modify: `frontend/src/components/MachineCard.jsx`
- Modify: `frontend/src/components/SelectedMachineView.jsx` (se usa totalHours)
- Create: `api/scripts/migrate-total-hours.js`

**Note:** Esegui questo task DOPO il Task 3 (eventual consistency) per non regredire le fix.

---

- [ ] **Step 1: Crea branch da main (non da fix/eventual-consistency)**
```bash
git checkout main && git pull
git checkout -b fix/total-hours-integer
```

- [ ] **Step 2: Crea script migrazione dati**

Crea `api/scripts/migrate-total-hours.js`:
```js
import ddbDocClient from '../db.js';
import { ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';

const { Items: cars = [] } = await ddbDocClient.send(new ScanCommand({
  TableName: TABLE_NAME,
  FilterExpression: '#t = :carType AND attribute_exists(totalHours)',
  ExpressionAttributeNames: { '#t': 'type' },
  ExpressionAttributeValues: { ':carType': 'CAR' },
}));

for (const car of cars) {
  const raw = car.totalHours;
  if (typeof raw === 'number') {
    console.log(`✓ ${car.plate} già intero (${raw} min), skip`);
    continue;
  }
  // Parsa "1h 30m" → 90
  const match = String(raw).match(/(\d+)h\s*(\d+)m/);
  if (!match) {
    console.warn(`⚠ ${car.plate} formato non riconosciuto: "${raw}", skip`);
    continue;
  }
  const totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
  await ddbDocClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: car.PK, SK: car.SK },
    UpdateExpression: 'set totalMinutes = :tm REMOVE totalHours',
    ExpressionAttributeValues: { ':tm': totalMinutes },
  }));
  console.log(`✓ ${car.plate}: "${raw}" → ${totalMinutes} min`);
}
console.log('Migrazione totalHours completata.');
```

- [ ] **Step 3: Esegui migrazione**
```bash
cd api && node scripts/migrate-total-hours.js
```

- [ ] **Step 4: Aggiorna workSessionService.js**

In `stop()`, sostituisci la sezione che scrive `totalHours`:
```js
// Prima:
const totalHoursStr = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
await ddbDocClient.send(new UpdateCommand({
  ...
  UpdateExpression: 'set totalHours = :th',
  ExpressionAttributeValues: { ':th': totalHoursStr },
}));

// Dopo:
await ddbDocClient.send(new UpdateCommand({
  TableName: TABLE_NAME,
  Key: { PK: `${CAR_PK_PREFIX}${carId}`, SK: CAR_SK_PREFIX },
  UpdateExpression: 'set totalMinutes = :tm',
  ExpressionAttributeValues: { ':tm': totalMins },
}));
```

- [ ] **Step 5: Aggiorna stopAllSessionsHandler.js**

Stessa sostituzione: `totalHours` stringa → `totalMinutes` intero.

- [ ] **Step 6: Aggiorna MachineCard.jsx**

Sostituisci il calcolo `totalMinutes` da sessioni con il valore dal campo `machine.totalMinutes`:

```jsx
// La funzione formatDuration rimane uguale
const formatDuration = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

// Usa machine.totalMinutes se disponibile, altrimenti somma le sessioni locali
const totalMinutes = machine?.totalMinutes ?? sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
```

Nel JSX dove mostra il tempo totale:
```jsx
<span className="text-xl font-bold text-brand-text">{formatDuration(totalMinutes)}</span>
```

- [ ] **Step 7: Commit e PR**
```bash
git add api/services/workSessionService.js api/stopAllSessionsHandler.js \
        api/scripts/migrate-total-hours.js frontend/src/components/MachineCard.jsx
git commit -m "fix: totalHours → totalMinutes (intero) + script migrazione dati"
gh pr create --title "fix: totalHours come intero (totalMinutes)" --body "Salva totalMinutes come intero invece di stringa. Include script di migrazione per dati esistenti."
```

---

## Task 5 — GSI2 per operatore

**Branch:** `fix/gsi2-operator`

**Contesto:** `getActiveByOperator()` e `getAllActive()` fanno un full table Scan. Con la tabella unica che contiene Cars, Users e Sessions, questo legge tutto. Serve un GSI2 con `GSI2PK = OPERATOR#{name}`.

**Files:**
- Modify: `infrastructure/lib/backend-stack.ts`
- Modify: `api/entities/workSession.js`
- Modify: `api/services/workSessionService.js`
- Create: `api/scripts/backfill-gsi2.js`

**Note:** Richiede CDK deploy dopo la modifica allo stack. Il backfill è necessario per le sessioni esistenti.

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/gsi2-operator
```

- [ ] **Step 2: Leggi backend-stack.ts per capire come è definito GSI1**
```bash
grep -n "GSI\|globalSecondaryIndex\|GlobalSecondaryIndex" infrastructure/lib/backend-stack.ts
```

- [ ] **Step 3: Aggiungi GSI2 alla definizione CDK**

In `infrastructure/lib/backend-stack.ts`, nella definizione della tabella DynamoDB, aggiungi un secondo GSI dopo GSI1:
```typescript
{
  indexName: 'GSI2',
  partitionKey: { name: 'GSI2PK', type: AttributeType.STRING },
  sortKey: { name: 'GSI2SK', type: AttributeType.STRING },
  projectionType: ProjectionType.ALL,
},
```

- [ ] **Step 4: Aggiorna toSessionItem per popolare GSI2PK e GSI2SK**

In `api/entities/workSession.js`:
```js
import { randomUUID } from 'crypto';
import { CAR_PK_PREFIX } from './car.js';

export const SESSION_PK_PREFIX = 'SESSION#';
export const SESSION_SK_PREFIX = 'METADATA#';
const OPERATOR_PK_PREFIX = 'OPERATOR#';

export const toSessionItem = (session) => ({
  PK: `${SESSION_PK_PREFIX}${session.id || randomUUID()}`,
  SK: SESSION_SK_PREFIX,
  GSI1PK: `${CAR_PK_PREFIX}${session.carId}`,
  GSI1SK: session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime,
  GSI2PK: `${OPERATOR_PK_PREFIX}${session.operatorName}`,
  GSI2SK: session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime,
  type: 'SESSION',
  ...session
});
```

- [ ] **Step 5: Aggiorna getActiveByOperator() e getAllActive() per usare GSI2**

In `api/services/workSessionService.js`:
```js
const OPERATOR_PK_PREFIX = 'OPERATOR#';

async function getActiveByOperator(operatorName) {
  const params = {
    TableName: TABLE_NAME,
    IndexName: 'GSI2',
    KeyConditionExpression: 'GSI2PK = :opPk',
    FilterExpression: 'attribute_not_exists(endTime)',
    ExpressionAttributeValues: {
      ':opPk': `${OPERATOR_PK_PREFIX}${operatorName}`,
    }
  };
  const data = await ddbDocClient.send(new QueryCommand(params));
  return data.Items || [];
}

async function getAllActive(req) {
  if (!req.user) throw new Error('User not logged in');
  // Non c'è un modo efficiente di fare "tutte le sessioni attive di tutti gli operatori"
  // senza Scan quando non si conosce la lista degli operatori a priori.
  // Usiamo ancora lo Scan ma con FilterExpression più precisa.
  // Alternativa futura: query GSI2 per ogni operatore noto (lista statica da mockData).
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: 'attribute_not_exists(endTime) AND #t = :sessionType',
    ExpressionAttributeNames: { '#t': 'type' },
    ExpressionAttributeValues: { ':sessionType': 'SESSION' }
  };
  const data = await ddbDocClient.send(new ScanCommand(params));
  return data.Items || [];
}
```

**Nota:** `getAllActive` continua ad usare Scan perché non conosciamo l'elenco operatori a runtime (viene da `mockData.js`). Una futura ottimizzazione è fare N query GSI2 in parallelo (una per operatore) usando la lista statica da `mockData.js`.

- [ ] **Step 6: Crea script backfill GSI2 per sessioni esistenti**

Crea `api/scripts/backfill-gsi2.js`:
```js
import ddbDocClient from '../db.js';
import { ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';

const { Items: sessions = [] } = await ddbDocClient.send(new ScanCommand({
  TableName: TABLE_NAME,
  FilterExpression: '#t = :sessionType AND attribute_not_exists(GSI2PK)',
  ExpressionAttributeNames: { '#t': 'type' },
  ExpressionAttributeValues: { ':sessionType': 'SESSION' },
}));

console.log(`${sessions.length} sessioni da aggiornare`);

for (const session of sessions) {
  await ddbDocClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      ...session,
      GSI2PK: `OPERATOR#${session.operatorName}`,
      GSI2SK: session.startTime,
    },
  }));
  console.log(`✓ ${session.PK}`);
}
console.log('Backfill GSI2 completato.');
```

- [ ] **Step 7: Deploy CDK**
```bash
cd infrastructure && npx cdk deploy
```

- [ ] **Step 8: Esegui backfill**
```bash
cd api && node scripts/backfill-gsi2.js
```

- [ ] **Step 9: Commit e PR**
```bash
git add infrastructure/lib/backend-stack.ts api/entities/workSession.js \
        api/services/workSessionService.js api/scripts/backfill-gsi2.js
git commit -m "feat: aggiunge GSI2 per operatore - elimina Scan in getActiveByOperator"
gh pr create --title "feat: GSI2 operatore" --body "Sostituisce full table Scan con Query su GSI2 per getActiveByOperator. Include script backfill per dati esistenti."
```

---

## Task 6 — RBAC sulle route admin

**Branch:** `fix/rbac-admin-routes`

**Contesto:** Le route che modificano o eliminano macchine (`POST /api/cars`, `PUT /api/cars/:id`, `DELETE /api/cars/:id`, `PUT /api/cars/:id/complete`, `PUT /api/cars/:id/restore`) non verificano il ruolo dell'utente. Un operatore autenticato può fare delete.

**Files:**
- Modify: `api/routes.js`
- Modify: `api/handler.js`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/rbac-admin-routes
```

- [ ] **Step 2: Aggiungi campo requireAdmin alle route sensibili**

In `api/routes.js`, aggiungi `requireAdmin: true` alle route che non devono essere accessibili agli operatori:
```js
{ 
  path: '/api/cars', 
  method: 'POST', 
  handler: (req) => services.cars.create(req, req.body),
  requireAuth: true,
  requireAdmin: true
},
{ 
  path: '/api/cars/:id', 
  method: 'PUT', 
  handler: (req) => services.cars.update(req, req.params.id, req.body),
  requireAuth: true,
  requireAdmin: true
},
{ 
  path: '/api/cars/:id', 
  method: 'DELETE', 
  handler: (req) => services.cars.remove(req, req.params.id),
  requireAuth: true,
  requireAdmin: true
},
```

- [ ] **Step 3: Aggiungi controllo requireAdmin in handler.js**

In `api/handler.js`, dopo il check `requireAuth`, aggiungi:
```js
if (route.requireAdmin && req.user?.role !== 'admin') {
  res.status(403).json({ error: 'Accesso negato: richiesto ruolo admin' });
  return lambdaRes;
}
```

- [ ] **Step 4: Verifica i ruoli utenti nel DB**
```bash
# Controlla che gli utenti admin abbiano role: 'admin' nel JWT payload
# Esegui e ispeziona manualmente
node -e "
import('./db.js').then(({ default: db }) => {
  db.send({ TableName: 'PanzaniDesign', FilterExpression: '#t = :u', ExpressionAttributeNames: {'#t':'type'}, ExpressionAttributeValues: {':u':'USER'} })
})
"
```

- [ ] **Step 5: Commit e PR**
```bash
git add api/routes.js api/handler.js
git commit -m "fix: aggiunge RBAC - route admin richiedono role=admin nel JWT"
gh pr create --title "fix: RBAC sulle route admin" --body "Aggiunge requireAdmin flag alle route sensibili. Solo utenti con role=admin nel JWT possono creare/modificare/eliminare macchine."
```

---

## Task 7 — Hook factory frontend

**Branch:** `fix/hook-factory`

**Contesto:** `useSessions.js` e `useCars.js` contengono ~7 hook con struttura identica (loading, error, data, execute). Circa 150 righe duplicate. Una factory `createApiHook` elimina la ripetizione e rende più semplice aggiungere funzionalità trasversali (es. retry, caching).

**Files:**
- Create: `frontend/src/hooks/createApiHook.js`
- Modify: `frontend/src/hooks/useSessions.js`
- Modify: `frontend/src/hooks/useCars.js`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/hook-factory
```

- [ ] **Step 2: Crea la factory**

Crea `frontend/src/hooks/createApiHook.js`:
```js
import { useState, useCallback } from 'react';
import { fetchWithAuth } from '../utils/api';
import { API_BASE_URL } from '../utils/constants';
import toast from 'react-hot-toast';

/**
 * Factory per hook di chiamate API.
 * @param {string} url - URL relativo (es. '/cars')
 * @param {object} options
 * @param {string} [options.method='GET']
 * @param {string} [options.successMessage] - Toast mostrato on success
 * @param {string} [options.errorMessage] - Toast mostrato on error
 * @param {Function} [options.buildUrl] - (args) => string, sovrascrive url se fornita
 * @param {Function} [options.buildBody] - (args) => object, corpo della richiesta
 */
export function createApiHook(url, { method = 'GET', successMessage, errorMessage, buildUrl, buildBody } = {}) {
  return function useApiHook({ onSuccess, onError } = {}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const execute = useCallback(async (...args) => {
      setLoading(true);
      setError(null);
      const resolvedUrl = buildUrl ? buildUrl(...args) : url;
      const body = buildBody ? buildBody(...args) : undefined;

      try {
        const response = await fetchWithAuth(`${API_BASE_URL}${resolvedUrl}`, {
          method,
          ...(body ? { body: JSON.stringify(body) } : {}),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || errorMessage || 'Errore nella comunicazione col server');
        }

        const result = await response.json();
        setData(result);
        if (successMessage) toast.success(successMessage);
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
}
```

- [ ] **Step 3: Riscrivi useSessions.js usando la factory**

```js
import { API_ENDPOINTS } from '../utils/constants';
import { createApiHook } from './createApiHook';

export const useGetAllActiveSessions = createApiHook(API_ENDPOINTS.SESSION_ALL_ACTIVE);

export const useGetActiveSessions = createApiHook(null, {
  buildUrl: (carId) => API_ENDPOINTS.SESSION_ACTIVE(carId),
});

export const useGetCarSessions = createApiHook(null, {
  buildUrl: (carId) => API_ENDPOINTS.SESSION_BY_CAR(carId),
});

export const useStartSession = createApiHook(API_ENDPOINTS.SESSION_START, {
  method: 'POST',
  successMessage: 'Lavoro avviato',
  buildBody: (carId, operatorName) => ({ carId, operatorName }),
});

export const useStopSession = createApiHook(API_ENDPOINTS.SESSION_STOP, {
  method: 'POST',
  successMessage: 'Lavoro fermato',
  buildBody: (carId, operatorName) => ({ carId, operatorName }),
});
```

**Nota:** `useStartSession.onSuccess` riceveva `result` per controllare `stoppedCars`. La factory passa il result a `onSuccess`, quindi il comportamento rimane invariato.

- [ ] **Step 4: Verifica che i componenti che usano questi hook continuino a funzionare**

Controlla manualmente che `SelectedMachineView.jsx`, `OperatorColumn.jsx`, `OperatorView.jsx`, `MachineCard.jsx` importino correttamente e che i tipi di argomenti passati a `execute` siano compatibili.

- [ ] **Step 5: Riscrivi la parte ripetuta di useCars.js usando la factory**

Identifica gli hook in `useCars.js` con struttura identica e convertili. Mantieni `useGetCars` separato se ha logica speciale (es. `filter`).

- [ ] **Step 6: Commit e PR**
```bash
git add frontend/src/hooks/createApiHook.js frontend/src/hooks/useSessions.js frontend/src/hooks/useCars.js
git commit -m "refactor: hook factory - elimina ~150 righe duplicate"
gh pr create --title "refactor: hook factory per API calls" --body "Introduce createApiHook factory. Elimina struttura loading/error/execute duplicata in tutti gli hook."
```

---

## Task 8 — AbortController negli hook

**Branch:** `fix/abort-controller`

**Contesto:** Se un componente si smonta mentre una fetch è in corso, `setState` viene chiamato su componente smontato. Con la factory del Task 7 questo si risolve in un unico posto.

**Files:**
- Modify: `frontend/src/hooks/createApiHook.js`

**Pre-requisito:** Task 7 completato e mergato.

---

- [ ] **Step 1: Crea branch da main (post-merge task 7)**
```bash
git checkout main && git pull
git checkout -b fix/abort-controller
```

- [ ] **Step 2: Aggiungi AbortController alla factory**

Modifica `frontend/src/hooks/createApiHook.js`:
```js
import { useState, useCallback, useRef, useEffect } from 'react';

export function createApiHook(url, options = {}) {
  const { method = 'GET', successMessage, errorMessage, buildUrl, buildBody } = options;

  return function useApiHook({ onSuccess, onError } = {}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const abortRef = useRef(null);

    useEffect(() => {
      return () => { abortRef.current?.abort(); };
    }, []);

    const execute = useCallback(async (...args) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      const resolvedUrl = buildUrl ? buildUrl(...args) : url;
      const body = buildBody ? buildBody(...args) : undefined;

      try {
        const response = await fetchWithAuth(`${API_BASE_URL}${resolvedUrl}`, {
          method,
          signal: controller.signal,
          ...(body ? { body: JSON.stringify(body) } : {}),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || errorMessage || 'Errore nella comunicazione col server');
        }

        const result = await response.json();
        setData(result);
        if (successMessage) toast.success(successMessage);
        if (onSuccess) onSuccess(result);
        return result;
      } catch (err) {
        if (err.name === 'AbortError') return; // componente smontato, ignora
        setError(err.message);
        if (onError) onError(err);
        else toast.error(err.message);
        throw err;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, [onSuccess, onError]);

    return { execute, loading, error, data };
  };
}
```

- [ ] **Step 3: Commit e PR**
```bash
git add frontend/src/hooks/createApiHook.js
git commit -m "fix: aggiunge AbortController negli hook - previene setState su componente smontato"
gh pr create --title "fix: AbortController negli hook" --body "Previene setState su componente smontato usando AbortController. Si risolve in un unico punto grazie alla factory."
```

---

## Task 9 — Skeleton state per isWorking

**Branch:** `fix/isworking-flash`

**Contesto:** `SelectedMachineView` mostra il bottone "Avvia" per un istante anche quando l'operatore sta già lavorando, perché `isWorking` inizia a `false` e viene verificato via API al mount.

**Files:**
- Modify: `frontend/src/components/SelectedMachineView.jsx`

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/isworking-flash
```

- [ ] **Step 2: Aggiungi stato isCheckingSession e skeleton**

In `SelectedMachineView.jsx`:
```jsx
const [isWorking, setIsWorking] = useState(false);
const [isCheckingSession, setIsCheckingSession] = useState(true); // nuovo

const { execute: checkActiveSessions } = useGetActiveSessions({
  onSuccess: (activeSessions) => {
    const mySession = activeSessions.find(s => s.operatorName === operatorName);
    setIsWorking(!!mySession);
    setIsCheckingSession(false); // nuovo
  }
});

// Nel JSX, sostituisci il bottone con:
{isCheckingSession ? (
  <div className="py-3 w-full rounded-lg border animate-pulse bg-brand-bg-300 border-brand-text-700" />
) : (
  <button
    onClick={handleWorkToggle}
    className={`py-3 w-full text-sm font-bold rounded-lg border shadow-sm transition uppercase tracking-widest ${
      isWorking
        ? 'text-white bg-red-600 border-red-700 hover:bg-red-700'
        : 'text-brand-text-700 border-brand-text-700 hover:opacity-90'
    }`}
  >
    {isWorking ? 'Stop' : 'Avvia'}
  </button>
)}
```

- [ ] **Step 3: Commit e PR**
```bash
git add frontend/src/components/SelectedMachineView.jsx
git commit -m "fix: skeleton state per isWorking - elimina flash del bottone Avvia"
gh pr create --title "fix: skeleton per isWorking" --body "Mostra un placeholder animato mentre si verifica lo stato della sessione, eliminando il flash del bottone 'Avvia'."
```

---

## Task 10 — Transazioni atomiche per start/stop

**Branch:** `fix/atomic-transactions`

**Contesto:** `start()` fa PutCommand (sessione) + UpdateCommand (car status) in sequenza non atomica. Se l'UpdateCommand fallisce, la sessione esiste ma la macchina rimane `waiting`. `TransactWriteItems` risolve questo.

**Files:**
- Modify: `api/services/workSessionService.js`

**Pre-requisito:** Task 3 (eventual consistency) completato e mergato per non regredire.

---

- [ ] **Step 1: Crea branch**
```bash
git checkout main && git pull
git checkout -b fix/atomic-transactions
```

- [ ] **Step 2: Aggiungi TransactWriteCommand agli import**

In `api/services/workSessionService.js`:
```js
import { PutCommand, QueryCommand, UpdateCommand, ScanCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
```

- [ ] **Step 3: Refactoring di start() con transazione**

Sostituisci le due operazioni separate alla fine di `start()`:
```js
// Prima (non atomico):
await ddbDocClient.send(new PutCommand({ TableName: TABLE_NAME, Item: session }));
await ddbDocClient.send(new UpdateCommand({ ... }));

// Dopo (atomico):
await ddbDocClient.send(new TransactWriteCommand({
  TransactItems: [
    {
      Put: {
        TableName: TABLE_NAME,
        Item: session,
      },
    },
    {
      Update: {
        TableName: TABLE_NAME,
        Key: { PK: `${CAR_PK_PREFIX}${carId}`, SK: CAR_SK_PREFIX },
        UpdateExpression: 'set #s = :inProgress',
        ConditionExpression: '#s <> :completed',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':inProgress': 'in_progress', ':completed': 'completed' },
      },
    },
  ],
}));
```

**Nota:** `TransactWriteItems` in DynamoDB ha un limite di 100 item per transazione e costa 2 WCU invece di 1. Per questo use case (2 item) è irrilevante.

**Nota 2:** Se la `ConditionExpression` fallisce (macchina già completata), tutta la transazione fallisce. Bisogna gestire `TransactionCanceledException`:
```js
try {
  await ddbDocClient.send(new TransactWriteCommand({ ... }));
} catch (e) {
  if (e.name === 'TransactionCanceledException') {
    // La macchina è completata, avvia la sessione senza aggiornare lo status
    await ddbDocClient.send(new PutCommand({ TableName: TABLE_NAME, Item: session }));
  } else {
    throw e;
  }
}
```

- [ ] **Step 4: Commit e PR**
```bash
git add api/services/workSessionService.js
git commit -m "fix: usa TransactWriteCommand per start() - atomicità sessione + status macchina"
gh pr create --title "fix: transazioni atomiche per start()" --body "Usa TransactWriteItems per garantire che la creazione della sessione e l'aggiornamento dello status macchina siano atomici."
```

---

## Ordine di esecuzione raccomandato

```
Task 1 (bcrypt)          → merge → deploy
Task 2 (UUID)            → merge → deploy
Task 3 (consistency)     → merge → deploy
Task 4 (totalMinutes)    → merge → deploy + run migration script
Task 5 (GSI2)            → merge → CDK deploy → run backfill script
Task 6 (RBAC)            → merge → deploy
Task 7 (hook factory)    → merge (solo frontend)
Task 8 (AbortController) → merge dopo Task 7 (solo frontend)
Task 9 (isWorking flash) → merge (solo frontend, indipendente)
Task 10 (transazioni)    → merge → deploy
```

I task 1-6 toccano il backend e richiedono deploy Lambda.
I task 7-9 toccano solo il frontend.
Il Task 10 può essere fatto in qualsiasi momento dopo il Task 3.
