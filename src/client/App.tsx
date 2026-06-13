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
  Save,
  ShieldCheck,
  Sparkles,
  Utensils
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import {
  ChildProfile,
  DinnerOutcome,
  FoodPreferenceStatus,
  Meal,
  MealRiskLevel,
  ShoppingList,
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

export function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [generatedMeals, setGeneratedMeals] = useState<Meal[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [activeMeal, setActiveMeal] = useState<Meal | null>(null);
  const [loggingMeal, setLoggingMeal] = useState<Meal | null>(null);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function refresh() {
    const [childrenResponse, mealsResponse, shoppingResponse] = await Promise.all([
      api.children(),
      api.meals(),
      api.shoppingLists()
    ]);
    setChildren(childrenResponse.children);
    setMeals(mealsResponse.meals);
    setShoppingLists(shoppingResponse.shoppingLists);
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

      <main>
        {tab === "home" ? (
          <HomeView
            children={children}
            meals={meals}
            shoppingLists={shoppingLists}
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
              const response = await api.createShoppingList([meal.id], `${meal.name} shopping list`);
              setShoppingLists((current) => [response.shoppingList, ...current]);
              setTab("shopping");
              setMessage("Shopping list created.");
            }}
          />
        ) : null}
        {tab === "shopping" ? (
          <ShoppingView
            shoppingLists={shoppingLists}
            onToggle={async (listId, itemId) => {
              const response = await api.toggleShoppingItem(listId, itemId);
              setShoppingLists((current) =>
                current.map((list) => (list.id === listId ? response.shoppingList : list))
              );
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

function HomeView({
  children,
  meals,
  shoppingLists,
  onNavigate
}: {
  children: ChildProfile[];
  meals: Meal[];
  shoppingLists: ShoppingList[];
  onNavigate: (tab: Tab) => void;
}) {
  const foodCount = children.reduce((count, child) => count + child.foodPreferences.length, 0);
  const childNames = children.map((child) => child.name).join(" + ") || "Family";

  return (
    <section className="stack home-stack">
      <section className="dinner-command">
        <p className="command-kicker">Dinner command center</p>
        <h2>What should we make tonight?</h2>
        <p>Start with the real constraint: what is in the kitchen and what Charlotte and James can handle.</p>
        <button className="home-primary-cta" type="button" onClick={() => onNavigate("plan")}>
          <Utensils aria-hidden="true" />
          <span>Plan tonight&apos;s dinner</span>
          <ArrowRight aria-hidden="true" />
        </button>
      </section>

      <div className="secondary-actions">
        <ActionButton icon={<Sparkles />} label="Use ingredients I have" onClick={() => onNavigate("plan")} />
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
        <Metric label="Shopping lists" value={shoppingLists.length.toString()} />
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
  const [availableIngredients, setAvailableIngredients] = useState("");
  const [avoidIngredients, setAvoidIngredients] = useState("");
  const [notes, setNotes] = useState("Adult-interesting, kid plates deconstructed.");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await api.generateMeals({
        numberOfMeals,
        maxCookTimeMinutes,
        availableIngredients: splitCsv(availableIngredients),
        avoidIngredients: splitCsv(avoidIngredients),
        desiredRiskLevels: [riskLevel],
        parentPreferences: ["adult-interesting", "deconstructed", "sauces on side"],
        notes
      });
      setGeneratedMeals(response.meals);
      setMessage(`Generated ${response.meals.length} meal suggestion${response.meals.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not generate meals.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack">
      <form className="panel form generator-panel" onSubmit={submit}>
        <h2>Use ingredients I have</h2>
        <label>
          Available ingredients
          <textarea
            placeholder="chicken thighs, rice, cucumber, tortillas"
            value={availableIngredients}
            onChange={(event) => setAvailableIngredients(event.target.value)}
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
          <Sparkles aria-hidden="true" /> {isBusy ? "Generating..." : "Generate meals"}
        </button>
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
            List
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
  shoppingLists,
  onToggle
}: {
  shoppingLists: ShoppingList[];
  onToggle: (listId: string, itemId: string) => void;
}) {
  const list = shoppingLists[0];
  if (!list) {
    return <EmptyState title="No shopping list yet" body="Create one from a saved meal." />;
  }

  const categories = [...new Set(list.items.map((item) => item.category))];
  return (
    <section className="stack">
      <section className="panel">
        <h2>{list.title}</h2>
        {categories.map((category) => (
          <div className="shopping-group" key={category}>
            <h3>{humanizeEnum(category)}</h3>
            {list.items
              .filter((item) => item.category === category)
              .map((item) => (
                <button
                  key={item.id}
                  className={`shopping-item ${item.isChecked ? "checked" : ""}`}
                  type="button"
                  onClick={() => onToggle(list.id, item.id)}
                >
                  <span>{item.isChecked ? "✓" : ""}</span>
                  {item.name}
                </button>
              ))}
          </div>
        ))}
      </section>
    </section>
  );
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
