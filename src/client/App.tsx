import {
  ArrowRight,
  Baby,
  BookOpen,
  Check,
  ChefHat,
  Clock3,
  ClipboardList,
  Home,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Utensils
} from "lucide-react";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";
import { api } from "./api";
import {
  ChildProfile,
  DinnerOutcome,
  FoodPreferenceStatus,
  HomeAssistantShoppingList,
  Meal,
  MealRiskLevel,
  dinnerOutcomes,
  foodPreferenceStatuses,
  humanizeEnum,
  mealRiskLevels,
  platingPreferences,
  splitCsv
} from "../shared/domain";

type Tab = "home" | "kids" | "plan" | "meals" | "shopping";

const outcomeLabels: Record<DinnerOutcome, string> = {
  ateHappily: "Ate happily",
  ateSome: "Ate some",
  tinyTry: "Tiny try",
  touchedSmelledLicked: "Touched",
  refused: "Refused",
  meltdown: "Meltdown",
  notOffered: "Not offered"
};

const statusGroups: FoodPreferenceStatus[] = [
  "loved",
  "accepted",
  "sometimes",
  "tinyTry",
  "rejected",
  "burnedOut",
  "unknown"
];

const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;

type UpdateServiceWorker = ReturnType<typeof registerSW>;

function useAppUpdate() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateServiceWorker, setUpdateServiceWorker] = useState<UpdateServiceWorker | null>(null);
  const currentVersionRef = useRef<string | null>(null);
  const isReloadingRef = useRef(false);

  const reloadPage = useCallback(() => {
    if (isReloadingRef.current) return;
    isReloadingRef.current = true;
    window.location.reload();
  }, []);

  const showUpdatePrompt = useCallback(() => {
    setIsUpdateAvailable(true);
  }, []);

  useEffect(() => {
    const updateWorker = registerSW({
      immediate: true,
      onNeedRefresh: showUpdatePrompt,
      onNeedReload: reloadPage,
      onRegisteredSW: (_swScriptUrl, registeredServiceWorker) => {
        setRegistration(registeredServiceWorker ?? null);
      },
      onRegisterError: (error) => {
        console.error("Service worker registration failed", error);
      }
    });

    setUpdateServiceWorker(() => updateWorker);
  }, [reloadPage, showUpdatePrompt]);

  useEffect(() => {
    let isDisposed = false;

    async function checkVersion() {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as { version?: string };
        if (!payload.version || isDisposed) return;

        if (currentVersionRef.current && currentVersionRef.current !== payload.version) {
          showUpdatePrompt();
          await registration?.update();
        }

        currentVersionRef.current = payload.version;
      } catch (error) {
        console.warn("Could not check app version", error);
      }
    }

    function checkWhenVisible() {
      if (document.visibilityState === "visible") {
        void checkVersion();
      }
    }

    void checkVersion();
    const interval = window.setInterval(checkVersion, VERSION_CHECK_INTERVAL_MS);
    window.addEventListener("focus", checkVersion);
    window.addEventListener("app-controller-change", showUpdatePrompt);
    document.addEventListener("visibilitychange", checkWhenVisible);

    return () => {
      isDisposed = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", checkVersion);
      window.removeEventListener("app-controller-change", showUpdatePrompt);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, [registration, showUpdatePrompt]);

  const updateApp = useCallback(async () => {
    const latestRegistration = await registration?.update().catch(() => registration);
    if (latestRegistration?.waiting && updateServiceWorker) {
      await updateServiceWorker(true);
      window.setTimeout(reloadPage, 1500);
      return;
    }

    reloadPage();
  }, [registration, reloadPage, updateServiceWorker]);

  return { isUpdateAvailable, updateApp };
}

export function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [generatedMeals, setGeneratedMeals] = useState<Meal[]>([]);
  const [homeAssistantList, setHomeAssistantList] = useState<HomeAssistantShoppingList | null>(null);
  const [activeMeal, setActiveMeal] = useState<Meal | null>(null);
  const [loggingMeal, setLoggingMeal] = useState<Meal | null>(null);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const { isUpdateAvailable, updateApp } = useAppUpdate();

  async function refresh() {
    const [childrenResponse, mealsResponse] = await Promise.all([
      api.children(),
      api.meals()
    ]);
    setChildren(childrenResponse.children);
    setMeals(mealsResponse.meals);
    await refreshHomeAssistantList();
  }

  async function refreshHomeAssistantList() {
    try {
      const response = await api.homeAssistantShoppingList();
      setHomeAssistantList(response.homeAssistant);
    } catch (error) {
      setHomeAssistantList(null);
      setMessage(error instanceof Error ? error.message : "Could not read the Home Assistant list.");
    }
  }

  useEffect(() => {
    refresh().catch((error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [message]);

  async function saveGeneratedMeal(meal: Meal) {
    setIsBusy(true);
    try {
      const response = await api.saveMeal(meal);
      setMeals((current) => [response.meal, ...current.filter((item) => item.id !== response.meal.id)]);
      setMessage(`${response.meal.name} saved.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save meal.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Family Meal Planner</p>
          <h1>{headlineFor(tab)}</h1>
        </div>
        <div className="header-mark">
          <ChefHat aria-hidden="true" />
        </div>
      </header>

      {message ? (
        <button className="toast" type="button" onClick={() => setMessage("")}>
          {message}
        </button>
      ) : null}

      {isUpdateAvailable ? (
        <button className="update-toast" type="button" onClick={updateApp}>
          <RefreshCw aria-hidden="true" />
          <span>Update available &mdash; tap to reload</span>
        </button>
      ) : null}

      <main>
        {tab === "home" ? (
          <HomeView
            children={children}
            meals={meals}
            homeAssistantList={homeAssistantList}
            onNavigate={setTab}
          />
        ) : null}
        {tab === "kids" ? (
          <KidsView children={children} onSaved={refresh} setMessage={setMessage} />
        ) : null}
        {tab === "plan" ? (
          <PlanView
            generatedMeals={generatedMeals}
            isBusy={isBusy}
            setBusy={setIsBusy}
            setGeneratedMeals={setGeneratedMeals}
            setMessage={setMessage}
            onSaveMeal={saveGeneratedMeal}
            onViewMeal={setActiveMeal}
          />
        ) : null}
        {tab === "meals" ? (
          <MealsView
            meals={meals}
            onViewMeal={setActiveMeal}
            onLogMeal={setLoggingMeal}
            onShoppingList={async (meal) => {
              setIsBusy(true);
              try {
                const response = await api.sendMealShoppingListToHomeAssistant(meal.id);
                const { addedCount, duplicateCount } = response.homeAssistant;
                await refreshHomeAssistantList();
                setTab("shopping");
                setMessage(formatHomeAssistantExportMessage(addedCount, duplicateCount));
              } catch (error) {
                setMessage(
                  error instanceof Error ? error.message : "Could not add recipe list to Home Assistant."
                );
              } finally {
                setIsBusy(false);
              }
            }}
          />
        ) : null}
        {tab === "shopping" ? (
          <ShoppingView
            isBusy={isBusy}
            homeAssistantList={homeAssistantList}
            onRefresh={async () => {
              setIsBusy(true);
              try {
                await refreshHomeAssistantList();
              } finally {
                setIsBusy(false);
              }
            }}
          />
        ) : null}
      </main>

      <TabBar active={tab} onChange={setTab} />

      {activeMeal ? (
        <MealDetailSheet
          meal={activeMeal}
          onClose={() => setActiveMeal(null)}
          onSave={() => saveGeneratedMeal(activeMeal)}
          onLog={() => {
            setLoggingMeal(activeMeal);
            setActiveMeal(null);
          }}
        />
      ) : null}

      {loggingMeal ? (
        <DinnerLogger
          meal={loggingMeal}
          onClose={() => setLoggingMeal(null)}
          onSaved={async () => {
            setLoggingMeal(null);
            await refresh();
            setMessage("Dinner result saved.");
          }}
        />
      ) : null}
    </div>
  );
}

function headlineFor(tab: Tab): string {
  return {
    home: "Dinner without the second dinner",
    kids: "Kid food profiles",
    plan: "Plan meals",
    meals: "Saved meals",
    shopping: "Shopping list"
  }[tab];
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function formatHomeAssistantExportMessage(addedCount: number, duplicateCount: number): string {
  if (addedCount === 0 && duplicateCount > 0) return "Those recipe items are already on the list.";
  if (addedCount === 0) return "No recipe items were added.";
  return `Added ${addedCount} item${addedCount === 1 ? "" : "s"} to Home Assistant.`;
}

function HomeView({
  children,
  meals,
  homeAssistantList,
  onNavigate
}: {
  children: ChildProfile[];
  meals: Meal[];
  homeAssistantList: HomeAssistantShoppingList | null;
  onNavigate: (tab: Tab) => void;
}) {
  const foodCount = children.reduce((count, child) => count + child.foodPreferences.length, 0);
  const childNames = children.map((child) => child.name).join(" + ") || "Family";

  return (
    <section className="stack home-stack">
      <section className="dinner-command">
        <p className="command-kicker">Dinner command center</p>
        <h2>What should we make tonight, Mavis?</h2>
        <p>Start with the real constraint: what is in the kitchen and what Charlotte and James can handle.</p>
        <button className="home-primary-cta" type="button" onClick={() => onNavigate("plan")}>
          <Utensils aria-hidden="true" />
          <span>Plan tonight&apos;s dinner</span>
          <ArrowRight aria-hidden="true" />
        </button>
      </section>

      <div className="secondary-actions">
        <ActionButton icon={<Sparkles />} label="Give dinner guidance" onClick={() => onNavigate("plan")} />
        <ActionButton icon={<BookOpen />} label="Pick from saved meals" onClick={() => onNavigate("meals")} />
        <ActionButton icon={<Baby />} label="Update kid food profiles" onClick={() => onNavigate("kids")} />
      </div>

      <section className="tonight-panel">
        <div>
          <p className="eyebrow">Tonight mode</p>
          <h2>{childNames}</h2>
        </div>
        <div className="tonight-grid">
          <span>Bridge meals</span>
          <span>Separate plates</span>
          <span>Low-pressure tries</span>
        </div>
      </section>

      <section className="home-status">
        <Metric label="Food notes" value={foodCount.toString()} />
        <Metric label="Saved meals" value={meals.length.toString()} />
        <Metric label="List items" value={(homeAssistantList?.items.length ?? 0).toString()} />
      </section>
    </section>
  );
}

function KidsView({
  children,
  onSaved,
  setMessage
}: {
  children: ChildProfile[];
  onSaved: () => Promise<void>;
  setMessage: (message: string) => void;
}) {
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id ?? "");
  const selectedChild = children.find((child) => child.id === selectedChildId) ?? children[0];

  useEffect(() => {
    if (!selectedChildId && children[0]) setSelectedChildId(children[0].id);
  }, [children, selectedChildId]);

  if (!selectedChild) {
    return (
      <EmptyState
        title="No kids yet"
        body="The app will seed Charlotte and James when the server starts."
      />
    );
  }

  return (
    <section className="stack">
      <div className="segmented">
        {children.map((child) => (
          <button
            key={child.id}
            className={child.id === selectedChild.id ? "active" : ""}
            type="button"
            onClick={() => setSelectedChildId(child.id)}
          >
            {child.name}
          </button>
        ))}
      </div>

      <ChildProfileCard child={selectedChild} onSaved={onSaved} setMessage={setMessage} />
      <FoodPreferenceForm child={selectedChild} onSaved={onSaved} setMessage={setMessage} />

      {statusGroups.map((status) => {
        const foods = selectedChild.foodPreferences.filter((preference) => preference.status === status);
        if (foods.length === 0) return null;

        return (
          <section className="panel" key={status}>
            <h2>{humanizeEnum(status)}</h2>
            <div className="food-list">
              {foods.map((food) => (
                <article className="food-row" key={food.id}>
                  <div>
                    <strong>{food.foodName}</strong>
                    <p>
                      {food.acceptedFormats.length
                        ? `Accepted: ${food.acceptedFormats.join(", ")}`
                        : "No accepted formats yet"}
                    </p>
                    {food.rejectedFormats.length ? (
                      <p>Rejected: {food.rejectedFormats.join(", ")}</p>
                    ) : null}
                  </div>
                  <div className="pill-stack">
                    {food.isSafeFallback ? <span className="pill good">Safe</span> : null}
                    {food.isHardNo ? <span className="pill risk">Hard no</span> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}

function ChildProfileCard({
  child,
  onSaved,
  setMessage
}: {
  child: ChildProfile;
  onSaved: () => Promise<void>;
  setMessage: (message: string) => void;
}) {
  const [notes, setNotes] = useState(child.notes);
  const [plating, setPlating] = useState(child.defaultPlatingPreference);
  const [allergies, setAllergies] = useState(child.allergiesOrRestrictions.join(", "));

  useEffect(() => {
    setNotes(child.notes);
    setPlating(child.defaultPlatingPreference);
    setAllergies(child.allergiesOrRestrictions.join(", "));
  }, [child]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await api.saveChild({
      id: child.id,
      name: child.name,
      age: child.age,
      notes,
      defaultPlatingPreference: plating,
      allergiesOrRestrictions: splitCsv(allergies)
    });
    await onSaved();
    setMessage(`${child.name}'s profile updated.`);
  }

  return (
    <form className="panel form profile-panel" onSubmit={submit}>
      <h2>{child.name}</h2>
      <label>
        Default plating
        <select value={plating} onChange={(event) => setPlating(event.target.value as typeof plating)}>
          {platingPreferences.map((preference) => (
            <option key={preference} value={preference}>
              {humanizeEnum(preference)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Allergies or restrictions
        <input value={allergies} onChange={(event) => setAllergies(event.target.value)} />
      </label>
      <label>
        Patterns to remember
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <button className="primary-button" type="submit">
        <Save aria-hidden="true" /> Save profile
      </button>
    </form>
  );
}

function FoodPreferenceForm({
  child,
  onSaved,
  setMessage
}: {
  child: ChildProfile;
  onSaved: () => Promise<void>;
  setMessage: (message: string) => void;
}) {
  const [foodName, setFoodName] = useState("");
  const [status, setStatus] = useState<FoodPreferenceStatus>("accepted");
  const [acceptedFormats, setAcceptedFormats] = useState("");
  const [rejectedFormats, setRejectedFormats] = useState("");
  const [notes, setNotes] = useState("");
  const [isSafeFallback, setIsSafeFallback] = useState(false);
  const [isHardNo, setIsHardNo] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!foodName.trim()) return;

    await api.addFoodPreference({
      childId: child.id,
      foodName,
      status,
      tags: [],
      acceptedFormats: splitCsv(acceptedFormats),
      rejectedFormats: splitCsv(rejectedFormats),
      notes,
      isSafeFallback,
      isHardNo
    });
    setFoodName("");
    setAcceptedFormats("");
    setRejectedFormats("");
    setNotes("");
    setIsSafeFallback(false);
    setIsHardNo(false);
    await onSaved();
    setMessage(`Added ${foodName} for ${child.name}.`);
  }

  return (
    <form className="panel form add-food-panel" onSubmit={submit}>
      <h2>Add food</h2>
      <label>
        Food
        <input value={foodName} onChange={(event) => setFoodName(event.target.value)} />
      </label>
      <label>
        Status
        <select value={status} onChange={(event) => setStatus(event.target.value as FoodPreferenceStatus)}>
          {foodPreferenceStatuses.map((item) => (
            <option key={item} value={item}>
              {humanizeEnum(item)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Accepted formats
        <input
          placeholder="plain, strips, crunchy"
          value={acceptedFormats}
          onChange={(event) => setAcceptedFormats(event.target.value)}
        />
      </label>
      <label>
        Rejected formats
        <input
          placeholder="saucy, spicy, mixed"
          value={rejectedFormats}
          onChange={(event) => setRejectedFormats(event.target.value)}
        />
      </label>
      <div className="toggle-row">
        <label>
          <input
            type="checkbox"
            checked={isSafeFallback}
            onChange={(event) => setIsSafeFallback(event.target.checked)}
          />
          Safe fallback
        </label>
        <label>
          <input
            type="checkbox"
            checked={isHardNo}
            onChange={(event) => setIsHardNo(event.target.checked)}
          />
          Hard no
        </label>
      </div>
      <label>
        Notes
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <button className="primary-button" type="submit">
        <Plus aria-hidden="true" /> Add food
      </button>
    </form>
  );
}

function PlanView({
  generatedMeals,
  isBusy,
  setBusy,
  setGeneratedMeals,
  setMessage,
  onSaveMeal,
  onViewMeal
}: {
  generatedMeals: Meal[];
  isBusy: boolean;
  setBusy: (busy: boolean) => void;
  setGeneratedMeals: (meals: Meal[]) => void;
  setMessage: (message: string) => void;
  onSaveMeal: (meal: Meal) => Promise<void>;
  onViewMeal: (meal: Meal) => void;
}) {
  const [numberOfMeals, setNumberOfMeals] = useState(3);
  const [maxCookTimeMinutes, setMaxCookTimeMinutes] = useState(45);
  const [riskLevel, setRiskLevel] = useState<MealRiskLevel>("bridge");
  const [guidance, setGuidance] = useState("");
  const [avoidIngredients, setAvoidIngredients] = useState("");
  const [notes, setNotes] = useState("Adult-interesting, kid plates deconstructed.");
  const [generationTotal, setGenerationTotal] = useState(0);
  const [generationCompleted, setGenerationCompleted] = useState(0);
  const [generationStep, setGenerationStep] = useState("");
  const [generationElapsedSeconds, setGenerationElapsedSeconds] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isGenerating || generationTotal === 0) return;
    setGenerationElapsedSeconds(0);
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setGenerationElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [generationTotal, isGenerating]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const targetMealCount = Math.max(1, Math.min(7, numberOfMeals));
    setBusy(true);
    setIsGenerating(true);
    setGeneratedMeals([]);
    setGenerationTotal(targetMealCount);
    setGenerationCompleted(0);
    setGenerationStep("Reading your constraints");
    let completedCount = 0;
    try {
      const nextMeals: Meal[] = [];
      for (let index = 0; index < targetMealCount; index += 1) {
        setGenerationStep(`Generating dinner ${index + 1} of ${targetMealCount}`);
        const batchContext =
          nextMeals.length > 0
            ? `\nAlready suggested in this batch: ${nextMeals.map((meal) => meal.name).join(", ")}. Do not repeat these meals.`
            : "";
        const response = await api.generateMeals({
          numberOfMeals: 1,
          maxCookTimeMinutes,
          guidance,
          availableIngredients: splitCsv(guidance),
          avoidIngredients: splitCsv(avoidIngredients),
          desiredRiskLevels: [riskLevel],
          parentPreferences: ["adult-interesting", "deconstructed", "sauces on side"],
          notes: `${notes}${batchContext}`
        });
        const meal = response.meals[0];
        if (meal) {
          nextMeals.push(meal);
          setGeneratedMeals([...nextMeals]);
        }
        completedCount = index + 1;
        setGenerationCompleted(completedCount);
      }
      setGenerationStep("Done");
      setMessage(`Generated ${nextMeals.length} meal suggestion${nextMeals.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `${completedCount}/${targetMealCount} complete. ${error.message}`
          : `${completedCount}/${targetMealCount} complete. Could not generate meals.`
      );
    } finally {
      setIsGenerating(false);
      setBusy(false);
    }
  }

  return (
    <section className="stack">
      <form className="panel form generator-panel" onSubmit={submit}>
        <h2>What sounds good?</h2>
        <label>
          Dinner guidance
          <textarea
            placeholder="Thai-ish, use the chicken thighs, something grillable, no soup, Costco rotisserie chicken"
            value={guidance}
            onChange={(event) => setGuidance(event.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Dinners
            <input
              type="number"
              min={1}
              max={7}
              value={numberOfMeals}
              onChange={(event) => setNumberOfMeals(Number(event.target.value))}
            />
          </label>
          <label>
            Max minutes
            <input
              type="number"
              min={10}
              value={maxCookTimeMinutes}
              onChange={(event) => setMaxCookTimeMinutes(Number(event.target.value))}
            />
          </label>
        </div>
        <label>
          Risk level
          <select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value as MealRiskLevel)}>
            {mealRiskLevels.map((level) => (
              <option key={level} value={level}>
                {humanizeEnum(level)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Avoid
          <input value={avoidIngredients} onChange={(event) => setAvoidIngredients(event.target.value)} />
        </label>
        <label>
          Parent notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button className="primary-button" type="submit" disabled={isBusy}>
          <Sparkles aria-hidden="true" />{" "}
          {isGenerating ? `Generating ${generationCompleted}/${generationTotal}` : "Generate meals"}
        </button>
        {isGenerating ? (
          <GenerationProgress
            completed={generationCompleted}
            elapsedSeconds={generationElapsedSeconds}
            step={generationStep}
            total={generationTotal}
          />
        ) : null}
      </form>

      <div className="meal-list">
        {generatedMeals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            primaryAction="Save"
            onPrimary={() => onSaveMeal(meal)}
            onView={() => onViewMeal(meal)}
          />
        ))}
      </div>
    </section>
  );
}

function GenerationProgress({
  completed,
  elapsedSeconds,
  step,
  total
}: {
  completed: number;
  elapsedSeconds: number;
  step: string;
  total: number;
}) {
  const percent = total > 0 ? Math.max(5, Math.round((completed / total) * 100)) : 5;
  return (
    <div className="generation-progress" aria-live="polite">
      <div className="generation-progress-header">
        <span>{completed}/{total} complete</span>
        <span>{formatElapsed(elapsedSeconds)}</span>
      </div>
      <div className="generation-progress-track" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
      <p>{step || "Working on it"}</p>
    </div>
  );
}

function MealsView({
  meals,
  onViewMeal,
  onLogMeal,
  onShoppingList
}: {
  meals: Meal[];
  onViewMeal: (meal: Meal) => void;
  onLogMeal: (meal: Meal) => void;
  onShoppingList: (meal: Meal) => void;
}) {
  if (meals.length === 0) {
    return <EmptyState title="No saved meals yet" body="Generate a bridge meal, then save it here." />;
  }

  return (
    <section className="meal-list">
      {meals.map((meal) => (
        <MealCard
          key={meal.id}
          meal={meal}
          primaryAction="Log result"
          onPrimary={() => onLogMeal(meal)}
          onView={() => onViewMeal(meal)}
          extraAction={() => onShoppingList(meal)}
        />
      ))}
    </section>
  );
}

function MealCard({
  meal,
  primaryAction,
  onPrimary,
  onView,
  extraAction
}: {
  meal: Meal;
  primaryAction: string;
  onPrimary: () => void;
  onView: () => void;
  extraAction?: () => void;
}) {
  return (
    <article className="meal-card">
      <div className="meal-card-header">
        <div>
          <h2>{meal.name}</h2>
          <div className="meal-meta">
            <span>
              <Clock3 aria-hidden="true" /> {meal.estimatedCookTimeMinutes ?? "?"} min
            </span>
            <span>{humanizeEnum(meal.archetype)}</span>
          </div>
        </div>
        <span className={`risk risk-${meal.riskLevel}`}>{humanizeEnum(meal.riskLevel)}</span>
      </div>
      <p>{meal.adultSummary}</p>
      <div className="component-strip" aria-label="Shared components">
        {meal.sharedComponents.slice(0, 5).map((component) => (
          <span key={component}>{component}</span>
        ))}
      </div>
      <div className="kid-summary">
        {meal.kidPlates.map((plate) => (
          <p key={plate.id}>
            <strong>{plate.childNameSnapshot}:</strong> {plate.plateComponents.join(", ")}
          </p>
        ))}
      </div>
      <p className="prep-line">
        <ShieldCheck aria-hidden="true" /> <span>{meal.prepStrategy[0]}</span>
      </p>
      <div className="button-row">
        <button className="secondary-button" type="button" onClick={onView}>
          Details
        </button>
        {extraAction ? (
          <button className="secondary-button" type="button" onClick={extraAction}>
            Add to list
          </button>
        ) : null}
        <button className="primary-button compact" type="button" onClick={onPrimary}>
          {primaryAction}
        </button>
      </div>
    </article>
  );
}

function MealDetailSheet({
  meal,
  onClose,
  onSave,
  onLog
}: {
  meal: Meal;
  onClose: () => void;
  onSave: () => void;
  onLog: () => void;
}) {
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true">
      <section className="sheet">
        <button className="icon-button close" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>{meal.name}</h2>
        <p>{meal.adultSummary}</p>
        <SectionList title="Shared components" items={meal.sharedComponents} />
        <SectionList title="Adult additions" items={meal.adultOnlyComponents} />
        <section>
          <h3>Kid plates</h3>
          {meal.kidPlates.map((plate) => (
            <article className="kid-plate" key={plate.id}>
              <strong>{plate.childNameSnapshot}</strong>
              <p>{plate.plateComponents.join(", ")}</p>
              <p>{plate.sauceInstructions}</p>
              <p>Tiny try: {plate.tinyTry}</p>
            </article>
          ))}
        </section>
        <SectionList title="Prep strategy" items={meal.prepStrategy} ordered />
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={onSave}>
            Save
          </button>
          <button className="primary-button compact" type="button" onClick={onLog}>
            Log result
          </button>
        </div>
      </section>
    </div>
  );
}

function DinnerLogger({
  meal,
  onClose,
  onSaved
}: {
  meal: Meal;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const components = useMemo(
    () =>
      meal.kidPlates.flatMap((plate) =>
        plate.plateComponents.map((component) => ({
          key: `${plate.childProfileId}:${component}`,
          childProfileId: plate.childProfileId,
          childNameSnapshot: plate.childNameSnapshot,
          foodName: component,
          format: component
        }))
      ),
    [meal]
  );
  const [outcomes, setOutcomes] = useState<Record<string, DinnerOutcome>>(
    Object.fromEntries(components.map((component) => [component.key, "notOffered"]))
  );
  const [workedWell, setWorkedWell] = useState(false);
  const [overallNotes, setOverallNotes] = useState("");
  const childGroups = meal.kidPlates.map((plate) => ({
    plate,
    components: components.filter((component) => component.childProfileId === plate.childProfileId)
  }));

  async function submit() {
    await api.logDinner({
      mealId: meal.id,
      workedWell,
      overallNotes,
      exposureResults: components.map((component) => ({
        childProfileId: component.childProfileId,
        childNameSnapshot: component.childNameSnapshot,
        foodName: component.foodName,
        format: component.format,
        outcome: outcomes[component.key] ?? "notOffered",
        notes: ""
      }))
    });
    await onSaved();
  }

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true">
      <section className="sheet logger-sheet">
        <button className="icon-button close" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>How did it go?</h2>
        <p>{meal.name}</p>
        {childGroups.map(({ plate, components: childComponents }) => (
          <section className="log-child" key={plate.childProfileId}>
            <h3>{plate.childNameSnapshot}</h3>
            {childComponents.map((component) => (
              <div className="log-row" key={component.key}>
                <strong>{component.foodName}</strong>
                <div className="outcome-grid">
                  {dinnerOutcomes.map((outcome) => (
                    <button
                      className={outcomes[component.key] === outcome ? "active" : ""}
                      key={outcome}
                      type="button"
                      onClick={() => setOutcomes((current) => ({ ...current, [component.key]: outcome }))}
                    >
                      {outcomeLabels[outcome]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
        <label className="check-label">
          <input
            type="checkbox"
            checked={workedWell}
            onChange={(event) => setWorkedWell(event.target.checked)}
          />
          Worked well
        </label>
        <label>
          Notes
          <textarea value={overallNotes} onChange={(event) => setOverallNotes(event.target.value)} />
        </label>
        <button className="primary-button" type="button" onClick={submit}>
          <Check aria-hidden="true" /> Save result
        </button>
      </section>
    </div>
  );
}

function ShoppingView({
  isBusy,
  homeAssistantList,
  onRefresh
}: {
  isBusy: boolean;
  homeAssistantList: HomeAssistantShoppingList | null;
  onRefresh: () => Promise<void>;
}) {
  if (!homeAssistantList) {
    return (
      <section className="stack">
        <EmptyState title="List unavailable" body="Could not read the Home Assistant list." />
        <button className="secondary-button" type="button" disabled={isBusy} onClick={onRefresh}>
          <RefreshCw aria-hidden="true" />
          Refresh
        </button>
      </section>
    );
  }

  if (!homeAssistantList.configured) {
    return (
      <EmptyState
        title="Home Assistant is not configured"
        body="Set HOME_ASSISTANT_TOKEN on the backend to show the shared list."
      />
    );
  }

  const statusGroups = groupHomeAssistantItems(homeAssistantList.items);

  return (
    <section className="stack">
      <section className="panel">
        <div className="shopping-header">
          <div>
            <h2>{homeAssistantList.title}</h2>
            <p>
              {homeAssistantList.items.length} item{homeAssistantList.items.length === 1 ? "" : "s"} from{" "}
              {homeAssistantList.todoEntityId}
            </p>
          </div>
          <button
            className="secondary-button"
            type="button"
            disabled={isBusy}
            onClick={onRefresh}
          >
            <RefreshCw aria-hidden="true" />
            Refresh
          </button>
        </div>
        {statusGroups.length === 0 ? (
          <p className="shopping-empty">No items are on the Home Assistant list.</p>
        ) : (
          statusGroups.map(({ status, items }) => (
            <div className="shopping-group" key={status}>
              <h3>{formatHomeAssistantStatus(status)}</h3>
              {items.map((item) => (
                <div key={item.id} className={`shopping-item status-${item.status ?? "unknown"}`}>
                  <span>{item.name}</span>
                  {item.status ? (
                    <span className="shopping-status">{formatHomeAssistantStatus(item.status)}</span>
                  ) : null}
                </div>
              ))}
            </div>
          ))
        )}
      </section>
    </section>
  );
}

function groupHomeAssistantItems(items: HomeAssistantShoppingList["items"]) {
  const order = ["needs_action", "completed"];
  const groups = new Map<string, HomeAssistantShoppingList["items"]>();

  for (const item of items) {
    const status = item.status ?? "unknown";
    groups.set(status, [...(groups.get(status) ?? []), item]);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => {
      const leftIndex = order.indexOf(left);
      const rightIndex = order.indexOf(right);
      if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    })
    .map(([status, items]) => ({ status, items }));
}

function formatHomeAssistantStatus(status: string): string {
  if (status === "needs_action") return "Needs action";
  return humanizeEnum(status);
}

function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const items: Array<{ tab: Tab; label: string; icon: ReactNode }> = [
    { tab: "home", label: "Home", icon: <Home /> },
    { tab: "kids", label: "Kids", icon: <Baby /> },
    { tab: "plan", label: "Plan", icon: <Utensils /> },
    { tab: "meals", label: "Meals", icon: <BookOpen /> },
    { tab: "shopping", label: "List", icon: <ClipboardList /> }
  ];

  return (
    <nav className="tab-bar" aria-label="Primary">
      {items.map((item) => (
        <button
          className={active === item.tab ? "active" : ""}
          key={item.tab}
          type="button"
          onClick={() => onChange(item.tab)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function ActionButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className="action-button" type="button" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SectionList({
  title,
  items,
  ordered = false
}: {
  title: string;
  items: string[];
  ordered?: boolean;
}) {
  if (items.length === 0) return null;
  const List = ordered ? "ol" : "ul";
  return (
    <section>
      <h3>{title}</h3>
      <List>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </List>
    </section>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  );
}
