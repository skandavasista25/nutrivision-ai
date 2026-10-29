import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { identifyFood, type RecognitionResult } from "../services/recognitionService";
import { calcNutrition, FOODS } from "../services/nutrition";
import { addMeal } from "../services/firestoreService";
import { MEAL_TYPES, type MealType } from "../types";
import { PageHeader } from "../components/ui";

const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB = 8;
const defaultMealType = (): MealType => { const h = new Date().getHours(); return h < 11 ? "breakfast" : h < 16 ? "lunch" : h < 21 ? "dinner" : "snack"; };

export default function Scanner() {
  const { user } = useAuth(); const toast = useToast(); const nav = useNavigate();
  const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState<string>();
  const [rec, setRec] = useState<RecognitionResult | null>(null); const [fileErr, setFileErr] = useState("");
  const [foodId, setFoodId] = useState(FOODS[0].id); const [custom, setCustom] = useState(false);
  const [name, setName] = useState(""); const [per, setPer] = useState({ calories: "", protein: "", carbohydrates: "", fat: "" });
  const [grams, setGrams] = useState("100"); const [mealType, setMealType] = useState<MealType>(defaultMealType());
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const onFile = async (f?: File) => {
    setFileErr(""); setRec(null);
    if (!f) return;
    if (!OK_TYPES.includes(f.type)) return setFileErr("Use a JPG, PNG or WebP image.");
    if (f.size > MAX_MB * 1024 * 1024) return setFileErr(`Image must be under ${MAX_MB} MB.`);
    setFile(f); setPreview(URL.createObjectURL(f));
    setRec(await identifyFood(f));
  };

  const base = FOODS.find((x) => x.id === foodId)!;
  const g = Number(grams);
  const per100 = custom ? { calories: Number(per.calories), protein: Number(per.protein), carbohydrates: Number(per.carbohydrates), fat: Number(per.fat) } : base;
  const valid = g > 0 && g <= 5000 && (!custom || (name.trim().length > 0 && Object.values(per100).every((n) => Number.isFinite(n) && n >= 0 && n <= 1000)));
  const result = useMemo(() => (valid ? calcNutrition(per100, g) : null), [valid, g, custom, foodId, per.calories, per.protein, per.carbohydrates, per.fat]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (!user || !result) return setErr("Check the portion size and nutrient values.");
    setBusy(true);
    try {
      await addMeal(user.uid, { foodName: custom ? name.trim() : base.name, mealType, portionGrams: g, eatenAt: new Date(), ...result });
      toast("Added to your diary"); nav("/diary");
    } catch { setErr("Couldn't save this meal. Try again."); setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Food scanner" sub="Upload a photo, then confirm the food and portion." />
      <div className="grid2">
        <section className="card">
          <h2>Photo</h2>
          <label className="drop" htmlFor="photo">
            {preview ? <img src={preview} alt="Uploaded food preview" /> : <><ImagePlus aria-hidden /><span>Choose a JPG, PNG or WebP image</span></>}
          </label>
          <input id="photo" className="sr" type="file" accept={OK_TYPES.join(",")} onChange={(e) => onFile(e.target.files?.[0])} />
          {fileErr && <p className="field-err">{fileErr}</p>}
          {file && rec?.status === "unavailable" && <div className="alert info">{rec.reason}</div>}
          {rec?.status === "ok" && (
            <div className="alert info">
              <strong>Model suggestions (confirm before saving):</strong>
              <div className="chips">{rec.predictions.map((p) => <button type="button" key={p.label} className="chip"
                onClick={() => { const m = FOODS.find((x) => x.name.toLowerCase().includes(p.label.toLowerCase())); if (m) { setFoodId(m.id); setCustom(false); } else { setCustom(true); setName(p.label); } }}>
                {p.label} ({Math.round(p.confidence * 100)}%)</button>)}</div>
            </div>
          )}
        </section>
        <section className="card">
          <h2>Nutrition estimate</h2>
          <form onSubmit={save} noValidate>
            {err && <div className="alert error" role="alert">{err}</div>}
            <div className="field"><label htmlFor="food">Food</label>
              <select id="food" disabled={custom} value={foodId} onChange={(e) => setFoodId(e.target.value)}>
                {FOODS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
            <label className="check"><input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} /> My food isn't listed. Enter values myself</label>
            {custom && (<>
              <div className="field"><label htmlFor="cname">Food name</label><input id="cname" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <p className="small muted">Nutrients per 100 g</p>
              <div className="row4">{(["calories", "protein", "carbohydrates", "fat"] as const).map((k) => (
                <div className="field" key={k}><label htmlFor={`p-${k}`}>{k === "calories" ? "Calories" : k[0].toUpperCase() + k.slice(1)}</label>
                  <input id={`p-${k}`} type="number" min="0" step="any" value={per[k]} onChange={(e) => setPer({ ...per, [k]: e.target.value })} /></div>))}</div>
            </>)}
            <div className="row2">
              <div className="field"><label htmlFor="g">Portion (grams)</label><input id="g" type="number" min="1" max="5000" value={grams} onChange={(e) => setGrams(e.target.value)} /></div>
              <div className="field"><label htmlFor="mt">Meal</label><select id="mt" value={mealType} onChange={(e) => setMealType(e.target.value as MealType)}>
                {MEAL_TYPES.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}</select></div>
            </div>
            {result ? (
              <div className="macro-row" aria-live="polite">
                <div><b>{result.calories}</b><span>kcal</span></div><div><b>{result.protein}</b><span>protein g</span></div>
                <div><b>{result.carbohydrates}</b><span>carbs g</span></div><div><b>{result.fat}</b><span>fat g</span></div>
              </div>) : <p className="muted small">Enter a valid portion to see the estimate.</p>}
            <p className="small muted">Estimates based on a sample dataset. Real values vary with preparation and brand.</p>
            <button className="btn primary block" disabled={busy || !result}>{busy ? "Saving…" : "Add to diary"}</button>
          </form>
        </section>
      </div>
    </>
  );
}
