# NutriVision AI

Food and nutrition tracker: React + TypeScript + Vite, Firebase Auth, Cloud Firestore, Recharts, and an optional FastAPI service for future image recognition.

**Honest status:** image recognition is *not* implemented. The scanner previews the photo and lets you pick or correct the food manually. The FastAPI endpoint returns HTTP 501 until a model is connected. Nutrition values come from a small sample dataset (`frontend/src/services/nutrition.ts`) and are estimates.

## Firebase setup

1. **Create a project:** [console.firebase.google.com](https://console.firebase.google.com) → Add project.
2. **Register a web app:** Project overview → `</>` Web → register. Copy the config values shown.
3. **Enable Email/Password:** Build → Authentication → Sign-in method → Email/Password → Enable.
4. **Create Firestore:** Build → Firestore Database → Create database (production mode), pick a region.
5. **Configure env variables:**
   ```bash
   cd frontend
   cp .env.example .env     # then paste your Firebase values
   npm install
   npm run dev              # http://localhost:5173
   ```
6. **Deploy the security rules** (from the repo root):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add       # choose your project
   firebase deploy --only firestore:rules
   ```
   (Or paste `firestore.rules` into Firestore → Rules → Publish.)

Also add your deployed domain under Authentication → Settings → Authorized domains before going live.

## Optional: FastAPI service
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Set `VITE_RECOGNITION_API_URL=http://localhost:8000` in `frontend/.env`. To add a real model, implement `load_model` and `predict` in `backend/app/services/recognition.py`.

## Data model
- `users/{uid}`: displayName, email, createdAt, preferences, nutritionGoals
- `users/{uid}/meals/{id}`: foodName, mealType, portionGrams, calories, protein, carbohydrates, fat, eatenAt (when eaten), createdAt (server time), optional imageUrl
- `users/{uid}/goals/current`: calorieTarget, proteinTarget, carbohydrateTarget, fatTarget, updatedAt

`eatenAt` is an addition to your spec: the dashboard and diary filter by it so entries land on the right local day. Day boundaries use the device's timezone.

## Security notes
- Rules require `request.auth.uid == {uid}` on every path, validate field types and ranges, and deny everything else. Ownership comes from the auth token, never from client-supplied fields.
- Passwords are handled only by Firebase Auth. No credentials are in source; `.env` is git-ignored.
- Firebase web config values are identifiers, not secrets. The rules are what protect data.
- Uploaded images are previewed in the browser only and are not stored. Add Firebase Storage with owner-only rules later if you want persistence.
- Goals are configurable estimates, not medical advice.

## Not yet done
- Your prompt was cut off mid-sentence in section 8; the final requirement was assumed to be "prevent one user from accessing another user's data".
- Composite-index-free queries only (single range field on `eatenAt`), so no index deployment is needed.
- No automated tests or emulator setup yet. Run `firebase emulators:start` to test rules locally.
