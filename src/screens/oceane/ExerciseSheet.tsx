import { Screen, BackHeader } from '../../components/Screen';
import { ExerciseGuideView } from '../../oceane/ExerciseGuideView';

/** Fiche d'un exercice, poussée depuis l'accueil ou le guide. */
export function OceaneExerciseSheet({ exerciseId }: { exerciseId: string }) {
  return (
    <Screen bottomPadding={48}>
      <BackHeader title="Comment faire" />
      <ExerciseGuideView exerciseId={exerciseId} />
    </Screen>
  );
}
