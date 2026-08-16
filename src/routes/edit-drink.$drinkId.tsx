import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";

import { AppFrame } from "#/components/app-frame";
import { DrinkForm } from "#/components/drink-form";
import { useAppState } from "#/hooks/use-app-state";
import { useHydrated } from "#/hooks/use-hydrated";

export const Route = createFileRoute("/edit-drink/$drinkId")({
  component: EditDrinkPage,
});

function EditDrinkPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const { drinkId } = Route.useParams();
  const { drinks, updateDrink, userProfile } = useAppState();

  if (!hydrated) {
    return <AppFrame title="Edit drink" backHref="/" />;
  }

  if (!userProfile) {
    return <Navigate to="/onboarding" />;
  }

  const drink = drinks.find((item) => item.id === drinkId);

  if (!drink) {
    return (
      <AppFrame title="Edit drink" backHref="/">
        <div className="grid min-h-[40vh] place-items-center p-8 text-sm text-muted-foreground">
          Drink not found.
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame title="Edit drink" backHref="/">
      <div className="mx-auto w-full max-w-2xl p-5 sm:p-6">
        <DrinkForm
          initialValue={drink}
          submitLabel="Save changes"
          onSubmit={async (value) => {
            await updateDrink(drink.id, value);
            await navigate({ to: "/" });
          }}
        />
      </div>
    </AppFrame>
  );
}
